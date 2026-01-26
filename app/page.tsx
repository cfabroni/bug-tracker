'use client'

import { useState, useEffect, useCallback } from 'react'
import { Check, X, Clock, ChevronDown, ChevronRight, Search, RefreshCw } from 'lucide-react'
import { supabase, TestCase, TestStatus } from '@/lib/supabase'
import { generateTestCases, initialTestCases } from '@/lib/test-data'

const STATUS = {
  UNTESTED: 'untested' as TestStatus,
  PASS: 'pass' as TestStatus,
  FAIL: 'fail' as TestStatus,
  BLOCKED: 'blocked' as TestStatus,
}

const statusConfig = {
  [STATUS.UNTESTED]: { label: 'Untested', color: '#64748b', bg: '#f1f5f9' },
  [STATUS.PASS]: { label: 'Pass', color: '#059669', bg: '#d1fae5' },
  [STATUS.FAIL]: { label: 'Fail', color: '#dc2626', bg: '#fee2e2' },
  [STATUS.BLOCKED]: { label: 'Blocked', color: '#d97706', bg: '#fef3c7' },
}

export default function Home() {
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(initialTestCases.map(c => c.category)))
  const [filter, setFilter] = useState<'all' | TestStatus>('all')
  const [search, setSearch] = useState('')
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        setTestCases(data)
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
      setTestCases(generateTestCases() as TestCase[])
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

  // Cycle status
  const cycleStatus = (id: string, currentStatus: TestStatus) => {
    const statuses = Object.values(STATUS)
    const currentIdx = statuses.indexOf(currentStatus)
    const newStatus = statuses[(currentIdx + 1) % statuses.length]
    updateTestCase(id, { status: newStatus })
  }

  // Reset all
  const resetAll = async () => {
    if (!confirm('Reset all test cases to untested?')) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('test_cases')
        .update({ status: 'untested', notes: '', updated_at: new Date().toISOString() })
        .neq('id', '')

      if (error) throw error

      setTestCases(prev =>
        prev.map(tc => ({ ...tc, status: 'untested' as TestStatus, notes: '' }))
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
        const matchesFilter = filter === 'all' || item.status === filter
        const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase())
        return matchesFilter && matchesSearch
      }),
    }))
    .filter(cat => cat.items.length > 0)

  // Stats
  const stats = {
    total: testCases.length,
    pass: testCases.filter(tc => tc.status === STATUS.PASS).length,
    fail: testCases.filter(tc => tc.status === STATUS.FAIL).length,
    blocked: testCases.filter(tc => tc.status === STATUS.BLOCKED).length,
    untested: testCases.filter(tc => tc.status === STATUS.UNTESTED).length,
  }
  const progress = stats.total > 0 ? Math.round((stats.pass / stats.total) * 100) : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center text-slate-200">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-slate-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" 
               style={{ borderWidth: '3px' }} />
          <p>Connecting to Supabase...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-slate-200 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Pocket Places
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Manual Testing Tracker
              {saving && <span className="ml-2 text-amber-400">● Saving...</span>}
              {!saving && !error && <span className="ml-2 text-emerald-400">● Synced</span>}
              {error && <span className="ml-2 text-red-400">● {error}</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => loadTestCases()}
              className="p-2 bg-transparent border border-slate-600 rounded-lg text-slate-400 hover:border-slate-500 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={resetAll}
              className="px-4 py-2 bg-transparent border border-slate-600 rounded-lg text-slate-400 hover:border-slate-500 transition-colors text-sm"
            >
              Reset All
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="bg-slate-800 rounded-xl p-5 mb-6 border border-slate-700">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-400">Progress</span>
                <span className="text-sm font-mono">
                  {stats.pass}/{stats.total} ({progress}%)
                </span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex gap-4 flex-wrap">
              {[
                { key: 'pass', label: 'Pass', value: stats.pass, color: 'text-emerald-400' },
                { key: 'fail', label: 'Fail', value: stats.fail, color: 'text-red-400' },
                { key: 'blocked', label: 'Blocked', value: stats.blocked, color: 'text-amber-400' },
                { key: 'untested', label: 'Untested', value: stats.untested, color: 'text-slate-400' },
              ].map(s => (
                <div key={s.key} className="text-center">
                  <div className={`text-2xl font-semibold font-mono ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-slate-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search test cases..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full py-2.5 pl-9 pr-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-slate-600"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all' as const, label: 'All' },
              { key: STATUS.UNTESTED, label: 'Untested' },
              { key: STATUS.PASS, label: 'Pass' },
              { key: STATUS.FAIL, label: 'Fail' },
              { key: STATUS.BLOCKED, label: 'Blocked' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  filter === f.key
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
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
              pass: items.filter(i => i.status === STATUS.PASS).length,
              total: items.length,
            }

            return (
              <div key={category} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
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
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-750"
                  style={{ borderBottom: isExpanded ? '1px solid #334155' : 'none' }}
                >
                  <div className="flex items-center gap-2.5">
                    {isExpanded ? (
                      <ChevronDown size={18} className="text-slate-500" />
                    ) : (
                      <ChevronRight size={18} className="text-slate-500" />
                    )}
                    <span className="font-medium">{category}</span>
                    <span className="text-xs text-slate-500 font-mono">
                      {catStats.pass}/{catStats.total}
                    </span>
                  </div>
                  <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{
                        width: `${catStats.total > 0 ? (catStats.pass / catStats.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Items */}
                {isExpanded && (
                  <div>
                    {items.map((item, idx) => {
                      const config = statusConfig[item.status]

                      return (
                        <div
                          key={item.id}
                          className={`flex items-start gap-3 px-4 py-3 ${
                            item.status === STATUS.FAIL ? 'bg-red-500/5' : ''
                          }`}
                          style={{
                            borderBottom: idx < items.length - 1 ? '1px solid #293548' : 'none',
                          }}
                        >
                          {/* Status Button */}
                          <button
                            onClick={() => cycleStatus(item.id, item.status)}
                            className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 transition-transform hover:scale-110"
                            style={{ background: config.bg, color: config.color }}
                            title="Click to cycle status"
                          >
                            {item.status === STATUS.PASS && <Check size={16} />}
                            {item.status === STATUS.FAIL && <X size={16} />}
                            {item.status === STATUS.BLOCKED && <Clock size={16} />}
                            {item.status === STATUS.UNTESTED && (
                              <span className="w-2 h-2 rounded-full bg-slate-500" />
                            )}
                          </button>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div
                              className={`text-sm ${
                                item.status === STATUS.PASS
                                  ? 'text-slate-400 line-through'
                                  : 'text-slate-200'
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
                                className="w-full mt-2 p-2 bg-slate-900 border border-slate-600 rounded-md text-slate-200 text-xs font-mono resize-y min-h-[60px] focus:outline-none focus:border-slate-500"
                              />
                            ) : (
                              <div
                                onClick={() => setEditingNote(item.id)}
                                className={`mt-1 text-xs cursor-pointer ${
                                  item.notes ? 'text-slate-400 font-mono' : 'text-slate-600'
                                }`}
                              >
                                {item.notes || '+ Add note'}
                              </div>
                            )}
                          </div>

                          {/* Status Badge */}
                          <span
                            className="px-2 py-1 rounded text-xs font-medium uppercase tracking-wider flex-shrink-0"
                            style={{ background: config.bg, color: config.color }}
                          >
                            {config.label}
                          </span>
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
          <div className="text-center py-12 text-slate-500">No test cases match your filters</div>
        )}

        {/* Footer */}
        <div className="mt-8 py-4 text-center text-slate-600 text-xs">
          Click status icons to cycle: Untested → Pass → Fail → Blocked
          <br />
          Data syncs with Supabase ☁️
        </div>
      </div>
    </div>
  )
}
