import { createClient } from "@supabase/supabase-js";

let client = null;

export function getSupabase() {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (typeof url !== "string" || url.length === 0 || typeof key !== "string" || key.length === 0) {
    throw new Error("Supabase credentials not configured");
  }
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export function dbConfigured() {
  return (
    typeof process.env.SUPABASE_URL === "string" && process.env.SUPABASE_URL.length > 0 &&
    typeof process.env.SUPABASE_SERVICE_ROLE_KEY === "string" && process.env.SUPABASE_SERVICE_ROLE_KEY.length > 0
  );
}