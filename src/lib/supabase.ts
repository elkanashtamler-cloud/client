import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

function createSupabase(): SupabaseClient | null {
  if (!supabaseUrl?.trim() || !supabaseAnonKey?.trim()) return null
  return createClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = createSupabase()
