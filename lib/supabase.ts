import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type TestStatus = 'untested' | 'pass' | 'fail' | 'blocked' | 'na'
export type Platform = 'ios' | 'android'

export interface Screenshot {
  id: string
  path: string
  url: string
  filename: string
  platform?: Platform | null
  uploaded_at: string
}

export interface TestCase {
  id: string
  category: string
  title: string
  status: TestStatus              // Legacy/overall status
  ios_status: TestStatus
  android_status: TestStatus
  notes: string
  screenshots: Screenshot[]
  created_by: 'seed' | 'user'
  updated_at: string
}
