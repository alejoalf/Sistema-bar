import { createClient } from '@supabase/supabase-js'

// Asegúrate de tener estas variables en tu archivo .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

// Validación para advertir al usuario
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase no configurado. Crea un archivo .env con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseKey)
