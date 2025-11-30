import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export let supabase = null;

try {
    if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
        throw new Error('Invalid Supabase URL');
    }
    supabase = createClient(supabaseUrl, supabaseAnonKey);
} catch (error) {
    console.error('Supabase initialization failed:', error);
    // Create a dummy client to prevent crash on usage, but operations will fail
    supabase = {
        from: () => ({
            insert: async () => ({ error: new Error('Supabase not configured') }),
            select: async () => ({ error: new Error('Supabase not configured') })
        })
    };
}
