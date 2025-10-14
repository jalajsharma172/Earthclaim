// shared/supabase-client.ts
import { createClient } from '@supabase/supabase-js'

// Universal environment variable loader
function getEnvVars() {
  // Server-side (Node.js)
  if (typeof process !== 'undefined' && process.env) {
    return {
      url: process.env.SUPABASE_URL,
      key: process.env.SUPABASE_KEY
    }
  }
  
  // Client-side (Vite/Browser)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return {
      url: (import.meta.env as any).VITE_SUPABASE_URL,
      key: (import.meta.env as any).VITE_SUPABASE_KEY
    }
  }
  
  throw new Error('Cannot determine environment - neither process.env nor import.meta.env are available')
}

const { url, key } = getEnvVars()

if (!url || !key) {
  const envType = typeof process !== 'undefined' ? 'Server' : 'Client'
  throw new Error(`
    Missing Supabase environment variables (${envType} side)
    - SUPABASE_URL: ${url ? '✓' : '✗'}
    - SUPABASE_KEY: ${key ?  '✓':'✗'}

    Server: Make sure SUPABASE_URL and SUPABASE_KEY are in your .env file
    Client: Make sure VITE_SUPABASE_URL and VITE_SUPABASE_KEY are in your .env file
  `)
}

export const supabase = createClient(url, key)










