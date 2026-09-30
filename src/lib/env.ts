export function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function appUrl(): string {
  return env("NEXT_PUBLIC_APP_URL").replace(/\/$/, "");
}
