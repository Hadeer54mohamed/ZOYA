import { createClient } from "@supabase/supabase-js";

/** Same as orders API: service role bypasses RLS on `discount_codes`. Do not use the anon key here. */
export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);
