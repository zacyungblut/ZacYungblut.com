import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Bypasses RLS entirely — the `server-only` import above makes bundling this
// into a client component a build error, since web_plays (visitor location
// and behavior data) has no public select policy on purpose. Only ever used
// by the password-gated /stats page.
export const supabaseAdmin = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  serviceRoleKey || "placeholder-service-role-key"
);
