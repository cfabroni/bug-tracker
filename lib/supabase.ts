import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type TestStatus = 'untested' | 'pass' | 'fail' | 'blocked'

export interface TestCase {
  id: string
  category: string
  title: string
  status: TestStatus
  notes: string
  updated_at: string
}
