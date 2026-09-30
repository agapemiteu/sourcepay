import Link from "next/link";
export default async function ClaimError({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { message } = await searchParams;
  return <main><div className="stack"><div className="panel"><p className="section-label">Channel verification</p><h1>We couldn&apos;t verify this channel.</h1><p className="muted">{message || "Try your claim link again."}</p><Link href="/" className="button secondary">Back to SourcePay</Link></div></div></main>;
}
