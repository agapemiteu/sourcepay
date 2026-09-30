import { appUrl } from "./env";

export async function notifyReadyPledges(sourceName: string, pledges: { id: string; amount: number; supporter_email: string | null }[]) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return;
  await Promise.allSettled(pledges.filter((pledge) => pledge.supporter_email).map(async (pledge) => {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: pledge.supporter_email,
        subject: `${sourceName} is ready to receive your SourcePay pledge`,
        text: `${sourceName} verified their YouTube channel. Your ₦${(pledge.amount / 100).toLocaleString()} pledge is ready. No money has been charged yet. Complete payment here: ${appUrl()}/pledge/${pledge.id}`,
      }),
    });
    if (!response.ok) throw new Error("Reminder email failed");
  }));
}
