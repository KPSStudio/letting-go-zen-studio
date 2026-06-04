// lib/supabase.ts
// Supabase client for browser/client components
// Uses the publishable (anon) key — safe to expose to client

import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)