import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: true,
  },
});

export async function fetchLatestMetalRates() {
  const { data, error } = await supabase
    .from("metal_rates")
    .select("gold_rate, silver_rate, updated_at")
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  return { data, error };
}
