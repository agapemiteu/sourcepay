import { getCloudflareContext } from "@opennextjs/cloudflare";

type Row = Record<string, any>;

// The parts of the D1 binding this app uses.
type D1 = {
  prepare(sql: string): {
    bind(...params: unknown[]): {
      all<T>(): Promise<{ results: T[] }>;
      first<T>(): Promise<T | null>;
      run(): Promise<{ meta: { changes: number } }>;
    };
  };
};

function database(): D1 {
  return (getCloudflareContext().env as unknown as { DB: D1 }).DB;
}

export async function all<T = Row>(sql: string, ...params: unknown[]): Promise<T[]> {
  return (await database().prepare(sql).bind(...params).all<T>()).results;
}

export async function first<T = Row>(sql: string, ...params: unknown[]): Promise<T | null> {
  return database().prepare(sql).bind(...params).first<T>();
}

export async function one<T = Row>(sql: string, ...params: unknown[]): Promise<T> {
  const row = await first<T>(sql, ...params);
  if (!row) throw new Error("Record not found");
  return row;
}

/** Returns the number of rows changed, so conditional updates can act as locks. */
export async function run(sql: string, ...params: unknown[]): Promise<number> {
  return (await database().prepare(sql).bind(...params).run()).meta.changes;
}

export function now(): string {
  return new Date().toISOString();
}
