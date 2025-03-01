import { createClient } from '@supabase/supabase-js';
import { env } from '~/env';

// Ensure that the environment variables are defined and are of the correct type
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Create the Supabase client
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
export const supabase = createClient(supabaseUrl, supabaseAnonKey);