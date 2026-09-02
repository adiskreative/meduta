import { createClient } from "@supabase/supabase-js";

// Client helper untuk Supabase Storage.
// - Server action: pakai service role key bila tersedia (boleh upload tanpa
//   harus menyetel policy per-bucket). Kalau kosong, jatuh ke anon key dan
//   pastikan bucket sudah punya policy upload untuk anon.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function getSupabaseAdmin() {
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL belum di-set.");
  const key = serviceKey || anonKey;
  if (!key) throw new Error("Supabase key belum di-set.");
  return createClient(url, key, { auth: { persistSession: false } });
}

export const SUPABASE_BUCKET = "avatars";
