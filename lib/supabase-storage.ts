// lib/supabase-storage.ts
// Generates signed download URLs for Sklep products
// Files stored in private 'sklep-products' bucket in Supabase Storage
// URLs expire after 24 hours for security

import { supabaseAdmin } from '@/lib/supabase-admin'

export async function generateDownloadUrl(fileName: string): Promise<string> {
    const { data, error } = await supabaseAdmin
        .storage
        .from('sklep-products')
        .createSignedUrl(fileName, 86400) // 24 hours in seconds

    if (error || !data) {
        console.error('Supabase storage error:', error)
        throw new Error(`Failed to generate download URL for ${fileName}`)
    }

    return data.signedUrl
}