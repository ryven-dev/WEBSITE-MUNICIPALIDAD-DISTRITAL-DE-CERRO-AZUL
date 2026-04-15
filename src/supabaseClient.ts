// src/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

// Asegúrate de que tus variables en .env se llamen así:
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or anonymous key is missing in .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)