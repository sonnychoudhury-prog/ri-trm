import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const REVOLUTION_INTELL_WORKSPACE = '0d843fca-2937-457f-8e5e-86225ab13ea7'
export const MUANDA_GLOBAL_WORKSPACE = 'ba581791-ee0f-4a99-9626-48e4f805e0e5'
