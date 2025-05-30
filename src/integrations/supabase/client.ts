
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dfaunbusectzqdlkyche.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmYXVuYnVzZWN0enFkbGt5Y2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwMzU1MTgsImV4cCI6MjA2MDYxMTUxOH0.teK6V4_6SXo3GnN-VZDJZxO3Eepi8rrmY4kF4FVuGH4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
})
