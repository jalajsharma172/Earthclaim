// shared/supabase-client.ts
import { createClient } from '@supabase/supabase-js'

// Universal environment variable loader
// function getEnvVars() {
//   // Server-side (Node.js)
//   if (typeof process !== 'undefined' && process.env) {
//     if (process.env.SUPABASE_URL) console.log("supabaseClient: Found process.env.SUPABASE_URL");
//     if (process.env.SUPABASE_KEY) console.log("supabaseClient: Found process.env.SUPABASE_KEY");

//     return {
//       url: process.env.SUPABASE_URL,
//       key: process.env.SUPABASE_KEY
//     }
//   }

//   // Client-side (Vite/Browser)
//   if (typeof import.meta !== 'undefined' && import.meta.env) {
//     console.log("supabaseClient: Running in Vite/Browser environment");
//     return {
//       url: (import.meta.env as any).VITE_SUPABASE_URL,
//       key: (import.meta.env as any).VITE_SUPABASE_KEY
//     }
//   }

//   throw new Error('Cannot determine environment - neither process.env nor import.meta.env are available')
// }

// const { url, key } = getEnvVars()

// if (!url || !key) {
//   const envType = typeof process !== 'undefined' ? 'Server' : 'Client'
//   console.error(`Supabase Config Error (${envType}): URL or Key missing.`);
//   // Don't throw immediately to allow app to start, but DB calls will fail
// }

export const supabase = createClient('https://ibzihlvnphmejtxlnieq.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliemlobHZucGhtZWp0eGxuaWVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMTAwMDYsImV4cCI6MjA2OTc4NjAwNn0.iu2uq-vudrFomiIDLHOlIsFNP_9ohN9zU62bK2_TqVA')


