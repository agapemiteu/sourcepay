import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

export function db() {
  return createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function one(query: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<any> {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Record not found");
  return data;
}
