import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vrdnpssojhkwvhuisrxi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyZG5wc3Nvamhrd3ZodWlzcnhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3OTY4ODksImV4cCI6MjA4MTM3Mjg4OX0.oarvwGF4SNrc51sm-Sv3Iynaekw7tmi4mpwD57eV8Jo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)