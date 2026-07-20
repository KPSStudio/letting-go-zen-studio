// lib/supabase-storage.ts
// Generates signed download URLs for Sklep products
// Files stored in private 'sklep-products' bucket in Supabase Storage
// URLs expire after 30 days — long enough that customers who read the email
// late (spam folder, busy week) can still download without contacting Joanna.

import { supabaseAdmin } from '@/lib/supabase-admin'

// 30 days, expressed in seconds. Change this one number to adjust the window.
const DOWNLOAD_LINK_LIFETIME_SECONDS = 60 * 60 * 24 * 30

export async function generateDownloadUrl(fileName: string): Promise<string> {
    const { data, error } = await supabaseAdmin
        .storage
        .from('sklep-products')
        .createSignedUrl(fileName, DOWNLOAD_LINK_LIFETIME_SECONDS)

    if (error || !data) {
        console.error('Supabase storage error:', error)
        throw new Error(`Failed to generate download URL for ${fileName}`)
    }

    return data.signedUrl
}