// lib/supabase-admin.ts
// Supabase admin client — server side ONLY
// Uses service_role key — NEVER import this in client components
// Only use in API routes and server actions

import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)