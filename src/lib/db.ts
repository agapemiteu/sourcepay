import postgres from "postgres";
import { env } from "./env";

type Row = Record<string, any>;

let client: postgres.Sql | undefined;

// Supabase transaction pooler (port 6543) needs prepare: false. Bigint IDs are parsed as numbers.
function sql(): postgres.Sql {
  client ??= postgres(env("DATABASE_URL"), {
    prepare: false,
    max: 1,
    types: { bigint: { to: 20, from: [20], serialize: (value: number) => String(value), parse: (value: string) => Number(value) } },
  });
  return client;
}

// Queries use ? placeholders.
function query(text: string, params: unknown[]) {
  let index = 0;
  return sql().unsafe(text.replace(/\?/g, () => `$${++index}`), params as any[]);
}

export async function all<T = Row>(text: string, ...params: unknown[]): Promise<T[]> {
  return [...await query(text, params)] as T[];
}

export async function first<T = Row>(text: string, ...params: unknown[]): Promise<T | null> {
  return (await all<T>(text, ...params))[0] ?? null;
}

export async function one<T = Row>(text: string, ...params: unknown[]): Promise<T> {
  const row = await first<T>(text, ...params);
  if (!row) throw new Error("Record not found");
  return row;
}

/** Returns the number of rows changed, so conditional updates can act as locks. */
export async function run(text: string, ...params: unknown[]): Promise<number> {
  return (await query(text, params)).count;
}

export function now(): string {
  return new Date().toISOString();
}
