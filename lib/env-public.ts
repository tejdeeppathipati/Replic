export const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const NEXT_PUBLIC_SUPABASE_HOST = (() => {
  if (!NEXT_PUBLIC_SUPABASE_URL) return "";
  try {
    return new URL(NEXT_PUBLIC_SUPABASE_URL).host;
  } catch {
    return "";
  }
})();

