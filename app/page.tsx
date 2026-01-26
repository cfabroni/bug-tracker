'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Check, X, Clock, ChevronDown, ChevronRight, Search, RefreshCw, Plus, Trash2, Image, Upload, XCircle, Smartphone, Apple, Ban } from 'lucide-react'
import { supabase, TestCase, TestStatus, Platform, Screenshot } from '@/lib/supabase'
import { generateTestCases, initialTestCases } from '@/lib/test-data'

const STATUS = {
  UNTESTED: 'untested' as TestStatus,
  PASS: 'pass' as TestStatus,
  FAIL: 'fail' as TestStatus,
  BLOCKED: 'blocked' as TestStatus,
  NA: 'na' as TestStatus,
}

const statusConfig = {
  [STATUS.UNTESTED]: { label: 'Untested', color: '#9B8B7F', bg: '#F5EDE6' },
  [STATUS.PASS]: { label: 'Pass', color: '#7BA86B', bg: '#E8F0E4' },
  [STATUS.FAIL]: { label: 'Fail', color: '#C85454', bg: '#F8E4E4' },
  [STATUS.BLOCKED]: { label: 'Blocked', color: '#D9A04E', bg: '#F8F0E0' },
  [STATUS.NA]: { label: 'N/A', color: '#6B95B8', bg: '#E4EEF4' },
}

type PlatformFilter = 'both' | 'ios' | 'android'

export default function Home() {
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(initialTestCases.map(c => c.category)))
  const [filter, setFilter] = useState<'all' | TestStatus>('all')
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('both')
  const [search, setSearch] = useState('')
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Add task form state
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTaskCategory, setNewTaskCategory] = useState('')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [customCategory, setCustomCategory] = useState('')

  // Screenshot state
  const [uploadingFor, setUploadingFor] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<Screenshot | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get unique categories from test cases
  const categories = Array.from(new Set(testCases.map(tc => tc.category)))

  // Load test cases from Supabase
  const loadTestCases = useCallback(async () => {
    try {
      setError(null)
      const { data, error } = await supabase
        .from('test_cases')
        .select('*')
        .order('id')

      if (error) throw error

      if (data && data.length > 0) {
        // Ensure screenshots is always an array
        const normalized = data.map(tc => ({
          ...tc,
          screenshots: tc.screenshots || [],
          ios_status: tc.ios_status || 'untested',
          android_status: tc.android_status || 'untested',
          created_by: tc.created_by || 'seed'
        }))
        setTestCases(normalized)
      } else {
        // Initialize with default test cases
        const defaults = generateTestCases()
        const { data: inserted, error: insertError } = await supabase
          .from('test_cases')
          .insert(defaults)
          .select()

        if (insertError) throw insertError
        setTestCases(inserted || defaults)
      }
    } catch (err: any) {
      console.error('Error loading test cases:', err)
      setError(err.message || 'Failed to load test cases')
      // Fall back to local data
      setTestCases(generateTestCases())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTestCases()
  }, [loadTestCases])

  // Update a test case
  const updateTestCase = async (id: string, updates: Partial<TestCase>) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('test_cases')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error

      setTestCases(prev =>
        prev.map(tc => (tc.id === id ? { ...tc, ...updates } : tc))
      )
    } catch (err: any) {
      console.error('Error updating test case:', err)
      setError(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // Cycle status for a specific platform
  const cycleStatus = (id: string, platform: Platform, currentStatus: TestStatus) => {
    const statuses = Object.values(STATUS)
    const currentIdx = statuses.indexOf(currentStatus)
    const newStatus = statuses[(currentIdx + 1) % statuses.length]

    const field = platform === 'ios' ? 'ios_status' : 'android_status'
    updateTestCase(id, { [field]: newStatus })
  }

  // Add new task
  const addNewTask = async () => {
    const category = newTaskCategory === '__new__' ? customCategory.trim() : newTaskCategory
    const title = newTaskTitle.trim()

    if (!category || !title) {
      setError('Please fill in both category and title')
      return
    }

    setSaving(true)
    try {
      const newId = crypto.randomUUID()
      const newTask = {
        id: newId,
        category,
        title,
        status: 'untested' as TestStatus,
        ios_status: 'untested' as TestStatus,
        android_status: 'untested' as TestStatus,
        notes: '',
        screenshots: [],
        created_by: 'user' as const,
      }

      const { error } = await supabase
        .from('test_cases')
        .insert(newTask)

      if (error) throw error

      setTestCases(prev => [...prev, { ...newTask, updated_at: new Date().toISOString() }])
      setShowAddTask(false)
      setNewTaskCategory('')
      setNewTaskTitle('')
      setCustomCategory('')

      // Expand the category if not already expanded
      setExpandedCategories(prev => new Set(Array.from(prev).concat([category])))
    } catch (err: any) {
      console.error('Error adding task:', err)
      setError(err.message || 'Failed to add task')
    } finally {
      setSaving(false)
    }
  }

  // Delete task (only user-created)
  const deleteTask = async (id: string) => {
    if (!confirm('Delete this task?')) return

    setSaving(true)
    try {
      // First delete any screenshots from storage
      const task = testCases.find(tc => tc.id === id)
      if (task?.screenshots?.length) {
        const paths = task.screenshots.map(s => s.path)
        await supabase.storage.from('test-screenshots').remove(paths)
      }

      const { error } = await supabase
        .from('test_cases')
        .delete()
        .eq('id', id)

      if (error) throw error

      setTestCases(prev => prev.filter(tc => tc.id !== id))
    } catch (err: any) {
      console.error('Error deleting task:', err)
      setError(err.message || 'Failed to delete task')
    } finally {
      setSaving(false)
    }
  }

  // Upload screenshot
  const uploadScreenshot = async (id: string, file: File, platform?: Platform) => {
    setSaving(true)
    try {
      const task = testCases.find(tc => tc.id === id)
      if (!task) throw new Error('Task not found')

      const ext = file.name.split('.').pop() || 'png'
      const filename = `${id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('test-screenshots')
        .upload(filename, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('test-screenshots')
        .getPublicUrl(filename)

      const newScreenshot: Screenshot = {
        id: crypto.randomUUID(),
        path: filename,
        url: publicUrl,
        filename: file.name,
        platform: platform || null,
        uploaded_at: new Date().toISOString(),
      }

      const updatedScreenshots = [...(task.screenshots || []), newScreenshot]
      await updateTestCase(id, { screenshots: updatedScreenshots })
      setUploadingFor(null)
    } catch (err: any) {
      console.error('Error uploading screenshot:', err)
      setError(err.message || 'Failed to upload screenshot')
    } finally {
      setSaving(false)
    }
  }

  // Delete screenshot
  const deleteScreenshot = async (taskId: string, screenshotId: string) => {
    setSaving(true)
    try {
      const task = testCases.find(tc => tc.id === taskId)
      if (!task) throw new Error('Task not found')

      const screenshot = task.screenshots?.find(s => s.id === screenshotId)
      if (!screenshot) throw new Error('Screenshot not found')

      // Delete from storage
      await supabase.storage.from('test-screenshots').remove([screenshot.path])

      // Update test case
      const updatedScreenshots = task.screenshots.filter(s => s.id !== screenshotId)
      await updateTestCase(taskId, { screenshots: updatedScreenshots })
      setPreviewImage(null)
    } catch (err: any) {
      console.error('Error deleting screenshot:', err)
      setError(err.message || 'Failed to delete screenshot')
    } finally {
      setSaving(false)
    }
  }

  // Reset all
  const resetAll = async () => {
    if (!confirm('Reset all test cases to untested? User-created tasks will be preserved.')) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('test_cases')
        .update({
          status: 'untested',
          ios_status: 'untested',
          android_status: 'untested',
          notes: '',
          screenshots: [],
          updated_at: new Date().toISOString()
        })
        .neq('id', '')

      if (error) throw error

      setTestCases(prev =>
        prev.map(tc => ({
          ...tc,
          status: 'untested' as TestStatus,
          ios_status: 'untested' as TestStatus,
          android_status: 'untested' as TestStatus,
          notes: '',
          screenshots: []
        }))
      )
    } catch (err: any) {
      console.error('Error resetting:', err)
      setError(err.message || 'Failed to reset')
    } finally {
      setSaving(false)
    }
  }

  // Group test cases by category
  const groupedByCategory = testCases.reduce((acc, tc) => {
    if (!acc[tc.category]) acc[tc.category] = []
    acc[tc.category].push(tc)
    return acc
  }, {} as Record<string, TestCase[]>)

  // Filter and search
  const filteredCategories = Object.entries(groupedByCategory)
    .map(([category, items]) => ({
      category,
      items: items.filter(item => {
        // Status filter based on platform
        let matchesFilter = filter === 'all'
        if (!matchesFilter) {
          if (platformFilter === 'ios') {
            matchesFilter = item.ios_status === filter
          } else if (platformFilter === 'android') {
            matchesFilter = item.android_status === filter
          } else {
            matchesFilter = item.ios_status === filter || item.android_status === filter
          }
        }
        const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase())
        return matchesFilter && matchesSearch
      }),
    }))
    .filter(cat => cat.items.length > 0)

  // Stats for each platform
  const getStats = (platform: PlatformFilter) => {
    const field = platform === 'ios' ? 'ios_status' : platform === 'android' ? 'android_status' : null

    if (field) {
      return {
        total: testCases.length,
        pass: testCases.filter(tc => tc[field] === STATUS.PASS).length,
        fail: testCases.filter(tc => tc[field] === STATUS.FAIL).length,
        blocked: testCases.filter(tc => tc[field] === STATUS.BLOCKED).length,
        untested: testCases.filter(tc => tc[field] === STATUS.UNTESTED).length,
        na: testCases.filter(tc => tc[field] === STATUS.NA).length,
      }
    }
    // Combined stats (count if either platform passes)
    return {
      total: testCases.length,
      pass: testCases.filter(tc => tc.ios_status === STATUS.PASS && tc.android_status === STATUS.PASS).length,
      fail: testCases.filter(tc => tc.ios_status === STATUS.FAIL || tc.android_status === STATUS.FAIL).length,
      blocked: testCases.filter(tc => tc.ios_status === STATUS.BLOCKED || tc.android_status === STATUS.BLOCKED).length,
      untested: testCases.filter(tc => tc.ios_status === STATUS.UNTESTED || tc.android_status === STATUS.UNTESTED).length,
      na: testCases.filter(tc => tc.ios_status === STATUS.NA && tc.android_status === STATUS.NA).length,
    }
  }

  const stats = getStats(platformFilter)
  const iosStats = getStats('ios')
  const androidStats = getStats('android')

  const progress = stats.total > 0 ? Math.round((stats.pass / stats.total) * 100) : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-text">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-border border-t-primary rounded-full animate-spin mx-auto mb-4"
               style={{ borderWidth: '3px' }} />
          <p className="text-text-secondary">Connecting to Supabase...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-text p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Pocket Places
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              Manual Testing Tracker
              {saving && <span className="ml-2 text-warning">● Saving...</span>}
              {!saving && !error && <span className="ml-2 text-success">● Synced</span>}
              {error && <span className="ml-2 text-destructive">● {error}</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddTask(true)}
              className="px-4 py-2 bg-primary hover:bg-primary-light rounded-lg text-text-inverse text-sm flex items-center gap-2 transition-colors"
            >
              <Plus size={16} />
              Add Task
            </button>
            <button
              onClick={() => loadTestCases()}
              className="p-2 bg-transparent border border-border rounded-lg text-text-secondary hover:border-primary transition-colors"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={resetAll}
              className="px-4 py-2 bg-transparent border border-border rounded-lg text-text-secondary hover:border-primary transition-colors text-sm"
            >
              Reset All
            </button>
          </div>
        </div>

        {/* Add Task Form */}
        {showAddTask && (
          <div className="bg-card rounded-xl p-5 mb-6 border border-border shadow-sm">
            <h3 className="text-lg font-medium mb-4">Add New Task</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">Category</label>
                <select
                  value={newTaskCategory}
                  onChange={e => setNewTaskCategory(e.target.value)}
                  className="w-full py-2 px-3 bg-input border border-input-border rounded-lg text-text text-sm focus:outline-none focus:border-primary"
                >
                  <option value="">Select category...</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="__new__">+ New Category</option>
                </select>
              </div>
              {newTaskCategory === '__new__' && (
                <div>
                  <label className="block text-sm text-text-secondary mb-1">New Category Name</label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                    placeholder="Enter category name..."
                    className="w-full py-2 px-3 bg-input border border-input-border rounded-lg text-text text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm text-text-secondary mb-1">Task Title</label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  placeholder="Enter task title..."
                  className="w-full py-2 px-3 bg-input border border-input-border rounded-lg text-text text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowAddTask(false)
                    setNewTaskCategory('')
                    setNewTaskTitle('')
                    setCustomCategory('')
                  }}
                  className="px-4 py-2 bg-transparent border border-border rounded-lg text-text-secondary hover:border-primary transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={addNewTask}
                  className="px-4 py-2 bg-primary hover:bg-primary-light rounded-lg text-text-inverse text-sm transition-colors"
                >
                  Add Task
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Bar with Platform Toggle */}
        <div className="bg-card rounded-xl p-5 mb-6 border border-border shadow-sm">
          {/* Platform Toggle */}
          <div className="flex gap-2 mb-4">
            {[
              { key: 'both' as PlatformFilter, label: 'Both Platforms' },
              { key: 'ios' as PlatformFilter, label: 'iOS', icon: Apple },
              { key: 'android' as PlatformFilter, label: 'Android', icon: Smartphone },
            ].map(p => (
              <button
                key={p.key}
                onClick={() => setPlatformFilter(p.key)}
                className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-colors ${
                  platformFilter === p.key
                    ? 'bg-primary text-text-inverse'
                    : 'bg-button hover:bg-button-hover text-text-secondary'
                }`}
              >
                {p.icon && <p.icon size={14} />}
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-text-secondary">
                  {platformFilter === 'both' ? 'Overall' : platformFilter === 'ios' ? 'iOS' : 'Android'} Progress
                </span>
                <span className="text-sm font-mono">
                  {stats.pass}/{stats.total} ({progress}%)
                </span>
              </div>
              <div className="h-2 bg-background-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-success to-success rounded-full transition-all duration-300"
                  style={{ width: `${progress}%`, opacity: 0.9 }}
                />
              </div>
            </div>

            <div className="flex gap-4 flex-wrap">
              {[
                { key: 'pass', label: 'Pass', value: stats.pass, color: 'text-success' },
                { key: 'fail', label: 'Fail', value: stats.fail, color: 'text-destructive' },
                { key: 'blocked', label: 'Blocked', value: stats.blocked, color: 'text-warning' },
                { key: 'untested', label: 'Untested', value: stats.untested, color: 'text-text-tertiary' },
              ].map(s => (
                <div key={s.key} className="text-center">
                  <div className={`text-2xl font-semibold font-mono ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-text-tertiary">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Platform-specific mini stats when viewing "both" */}
          {platformFilter === 'both' && (
            <div className="flex gap-4 mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <Apple size={14} className="text-text-tertiary" />
                <span className="text-xs text-text-tertiary">iOS:</span>
                <span className="text-xs font-mono text-success">{iosStats.pass} pass</span>
                <span className="text-xs font-mono text-destructive">{iosStats.fail} fail</span>
              </div>
              <div className="flex items-center gap-2">
                <Smartphone size={14} className="text-text-tertiary" />
                <span className="text-xs text-text-tertiary">Android:</span>
                <span className="text-xs font-mono text-success">{androidStats.pass} pass</span>
                <span className="text-xs font-mono text-destructive">{androidStats.fail} fail</span>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search test cases..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full py-2.5 pl-9 pr-3 bg-card border border-border rounded-lg text-text text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all' as const, label: 'All' },
              { key: STATUS.UNTESTED, label: 'Untested' },
              { key: STATUS.PASS, label: 'Pass' },
              { key: STATUS.FAIL, label: 'Fail' },
              { key: STATUS.BLOCKED, label: 'Blocked' },
              { key: STATUS.NA, label: 'N/A' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  filter === f.key
                    ? 'bg-primary text-text-inverse border-primary'
                    : 'bg-card text-text-secondary border-border hover:border-primary'
                } border`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-col gap-3">
          {filteredCategories.map(({ category, items }) => {
            const isExpanded = expandedCategories.has(category)
            const catStats = {
              iosPass: items.filter(i => i.ios_status === STATUS.PASS).length,
              androidPass: items.filter(i => i.android_status === STATUS.PASS).length,
              total: items.length,
            }

            return (
              <div key={category} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                {/* Category Header */}
                <div
                  onClick={() => {
                    setExpandedCategories(prev => {
                      const next = new Set(prev)
                      if (next.has(category)) next.delete(category)
                      else next.add(category)
                      return next
                    })
                  }}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-background-secondary"
                  style={{ borderBottom: isExpanded ? '1px solid var(--color-border)' : 'none' }}
                >
                  <div className="flex items-center gap-2.5">
                    {isExpanded ? (
                      <ChevronDown size={18} className="text-text-tertiary" />
                    ) : (
                      <ChevronRight size={18} className="text-text-tertiary" />
                    )}
                    <span className="font-medium">{category}</span>
                    <span className="text-xs text-text-tertiary font-mono flex items-center gap-2">
                      <span className="flex items-center gap-0.5">
                        <Apple size={10} />
                        {catStats.iosPass}/{catStats.total}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Smartphone size={10} />
                        {catStats.androidPass}/{catStats.total}
                      </span>
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-8 h-1 bg-background-secondary rounded-full overflow-hidden" title="iOS">
                      <div
                        className="h-full bg-success rounded-full"
                        style={{
                          width: `${catStats.total > 0 ? (catStats.iosPass / catStats.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <div className="w-8 h-1 bg-background-secondary rounded-full overflow-hidden" title="Android">
                      <div
                        className="h-full bg-info rounded-full"
                        style={{
                          width: `${catStats.total > 0 ? (catStats.androidPass / catStats.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Items */}
                {isExpanded && (
                  <div>
                    {items.map((item, idx) => {
                      const iosConfig = statusConfig[item.ios_status]
                      const androidConfig = statusConfig[item.android_status]

                      return (
                        <div
                          key={item.id}
                          className={`px-4 py-3 ${
                            item.ios_status === STATUS.FAIL || item.android_status === STATUS.FAIL ? 'bg-destructive/5' : ''
                          }`}
                          style={{
                            borderBottom: idx < items.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
                          }}
                        >
                          <div className="flex items-start gap-3">
                            {/* Platform Status Buttons */}
                            <div className="flex flex-col gap-1">
                              {/* iOS Button */}
                              <button
                                onClick={() => cycleStatus(item.id, 'ios', item.ios_status)}
                                className="w-8 h-6 rounded flex items-center justify-center gap-0.5 transition-transform hover:scale-105 text-xs"
                                style={{ background: iosConfig.bg, color: iosConfig.color }}
                                title={`iOS: ${iosConfig.label} (click to cycle)`}
                              >
                                <Apple size={10} />
                                {item.ios_status === STATUS.PASS && <Check size={10} />}
                                {item.ios_status === STATUS.FAIL && <X size={10} />}
                                {item.ios_status === STATUS.BLOCKED && <Clock size={10} />}
                                {item.ios_status === STATUS.NA && <Ban size={10} />}
                                {item.ios_status === STATUS.UNTESTED && <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary" />}
                              </button>
                              {/* Android Button */}
                              <button
                                onClick={() => cycleStatus(item.id, 'android', item.android_status)}
                                className="w-8 h-6 rounded flex items-center justify-center gap-0.5 transition-transform hover:scale-105 text-xs"
                                style={{ background: androidConfig.bg, color: androidConfig.color }}
                                title={`Android: ${androidConfig.label} (click to cycle)`}
                              >
                                <Smartphone size={10} />
                                {item.android_status === STATUS.PASS && <Check size={10} />}
                                {item.android_status === STATUS.FAIL && <X size={10} />}
                                {item.android_status === STATUS.BLOCKED && <Clock size={10} />}
                                {item.android_status === STATUS.NA && <Ban size={10} />}
                                {item.android_status === STATUS.UNTESTED && <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary" />}
                              </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div
                                className={`text-sm ${
                                  item.ios_status === STATUS.PASS && item.android_status === STATUS.PASS
                                    ? 'text-text-tertiary line-through'
                                    : 'text-text'
                                }`}
                              >
                                {item.title}
                              </div>

                              {/* Notes */}
                              {editingNote === item.id ? (
                                <textarea
                                  autoFocus
                                  value={item.notes}
                                  onChange={e => {
                                    const newNotes = e.target.value
                                    setTestCases(prev =>
                                      prev.map(tc =>
                                        tc.id === item.id ? { ...tc, notes: newNotes } : tc
                                      )
                                    )
                                  }}
                                  onBlur={() => {
                                    updateTestCase(item.id, { notes: item.notes })
                                    setEditingNote(null)
                                  }}
                                  placeholder="Add notes..."
                                  className="w-full mt-2 p-2 bg-input border border-input-border rounded-md text-text text-xs font-mono resize-y min-h-[60px] focus:outline-none focus:border-primary"
                                />
                              ) : (
                                <div
                                  onClick={() => setEditingNote(item.id)}
                                  className={`mt-1 text-xs cursor-pointer ${
                                    item.notes ? 'text-text-secondary font-mono' : 'text-text-tertiary'
                                  }`}
                                >
                                  {item.notes || '+ Add note'}
                                </div>
                              )}

                              {/* Screenshots */}
                              <div className="mt-2">
                                {/* Thumbnail Grid */}
                                {item.screenshots && item.screenshots.length > 0 && (
                                  <div className="flex gap-2 flex-wrap mb-2">
                                    {item.screenshots.map(screenshot => (
                                      <div
                                        key={screenshot.id}
                                        className="relative group"
                                      >
                                        <img
                                          src={screenshot.url}
                                          alt={screenshot.filename}
                                          className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                          onClick={() => setPreviewImage(screenshot)}
                                        />
                                        {screenshot.platform && (
                                          <span className="absolute bottom-0.5 left-0.5 bg-black/60 px-1 rounded text-[8px] flex items-center gap-0.5 text-white">
                                            {screenshot.platform === 'ios' ? <Apple size={8} /> : <Smartphone size={8} />}
                                          </span>
                                        )}
                                        <button
                                          onClick={() => deleteScreenshot(item.id, screenshot.id)}
                                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                                        >
                                          <X size={12} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Upload Button */}
                                {uploadingFor === item.id ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      ref={fileInputRef}
                                      type="file"
                                      accept="image/*"
                                      onChange={e => {
                                        const file = e.target.files?.[0]
                                        if (file) uploadScreenshot(item.id, file)
                                      }}
                                      className="hidden"
                                    />
                                    <button
                                      onClick={() => fileInputRef.current?.click()}
                                      className="px-2 py-1 bg-button hover:bg-button-hover rounded text-xs flex items-center gap-1"
                                    >
                                      <Upload size={12} />
                                      Choose File
                                    </button>
                                    <button
                                      onClick={() => setUploadingFor(null)}
                                      className="px-2 py-1 bg-button hover:bg-button-hover rounded text-xs"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setUploadingFor(item.id)}
                                    className="text-xs text-text-tertiary hover:text-text-secondary flex items-center gap-1"
                                  >
                                    <Image size={12} />
                                    + Add screenshot
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Status Badges & Delete */}
                            <div className="flex items-start gap-2">
                              <div className="flex flex-col gap-1">
                                <span
                                  className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider flex items-center gap-1"
                                  style={{ background: iosConfig.bg, color: iosConfig.color }}
                                >
                                  <Apple size={10} />
                                  {iosConfig.label}
                                </span>
                                <span
                                  className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider flex items-center gap-1"
                                  style={{ background: androidConfig.bg, color: androidConfig.color }}
                                >
                                  <Smartphone size={10} />
                                  {androidConfig.label}
                                </span>
                              </div>
                              {item.created_by === 'user' && (
                                <button
                                  onClick={() => deleteTask(item.id)}
                                  className="p-1.5 text-text-tertiary hover:text-destructive transition-colors"
                                  title="Delete task"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12 text-text-tertiary">No test cases match your filters</div>
        )}

        {/* Footer */}
        <div className="mt-8 py-4 text-center text-text-tertiary text-xs">
          Click platform buttons to cycle: Untested → Pass → Fail → Blocked → N/A
          <br />
          Data syncs with Supabase
        </div>
      </div>

      {/* Screenshot Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'var(--color-overlay)' }}
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={previewImage.url}
              alt={previewImage.filename}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <button
              onClick={e => {
                e.stopPropagation()
                setPreviewImage(null)
              }}
              className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white"
            >
              <XCircle size={20} />
            </button>
            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white">
              {previewImage.filename}
              {previewImage.platform && (
                <span className="ml-2 flex items-center gap-1 inline-flex">
                  {previewImage.platform === 'ios' ? <Apple size={10} /> : <Smartphone size={10} />}
                  {previewImage.platform.toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for screenshots */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file && uploadingFor) {
            uploadScreenshot(uploadingFor, file)
          }
        }}
      />
    </div>
  )
}
