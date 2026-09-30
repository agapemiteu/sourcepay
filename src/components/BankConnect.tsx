"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Bank = { name: string; code: string };
export function BankConnect() {
  const router = useRouter();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [accountName, setAccountName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { fetch("/api/payouts/banks").then((response) => response.json()).then((result) => { if (result.error) throw new Error(result.error); setBanks(result.banks); }).catch((cause) => setError(cause.message)); }, []);
  async function send(path: string, body: unknown) {
    const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  }
  async function resolve(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setAccountName("");
    try { const result = await send("/api/payouts/resolve", { bankCode, accountNumber }); setAccountName(result.accountName); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not verify account."); }
    finally { setBusy(false); }
  }
  async function connect() {
    setBusy(true); setError("");
    try { const result = await send("/api/payouts/connect", { bankCode, accountNumber, confirmedName: accountName, phone }); router.push(`/claim/complete?source=${result.sourceId}`); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not connect account."); setBusy(false); }
  }
  return <form onSubmit={resolve}><label className="field"><span>Bank</span><select required value={bankCode} onChange={(event) => { setBankCode(event.target.value); setAccountName(""); }}><option value="">Choose a bank</option>{banks.map((bank) => <option key={bank.code} value={bank.code}>{bank.name}</option>)}</select></label><label className="field"><span>Account number</span><input inputMode="numeric" pattern="[0-9]{10}" maxLength={10} required value={accountNumber} onChange={(event) => { setAccountNumber(event.target.value.replace(/\D/g, "")); setAccountName(""); }} placeholder="10 digit account number"/></label>{error && <p className="error">{error}</p>}{!accountName ? <button className="button full" disabled={busy}>{busy ? "Verifying account..." : "Verify account"}</button> : <><div className="account-confirm"><strong>{accountName}</strong><span>{banks.find((bank) => bank.code === bankCode)?.name} ···· {accountNumber.slice(-4)}</span></div><label className="field"><span>Contact phone for Flutterwave</span><input type="tel" inputMode="tel" required pattern="\+?[0-9]{10,15}" value={phone} onChange={(event) => setPhone(event.target.value.replace(/[^+\d]/g, ""))} placeholder="08012345678"/></label><button className="button full" type="button" disabled={busy || !/^\+?\d{10,15}$/.test(phone)} onClick={connect}>{busy ? "Connecting..." : "Confirm account and connect"}</button></>}</form>;
}
