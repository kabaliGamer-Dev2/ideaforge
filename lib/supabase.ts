import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient<any> | null = null;

export function getSupabase(): SupabaseClient<any> {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (typeof url !== "string" || url.length === 0 || typeof key !== "string" || key.length === 0) {
    throw new Error("Supabase credentials not configured");
  }
  client = createClient<any>(url, key, { auth: { persistSession: false } });
  return client;
}