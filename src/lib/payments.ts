import { env } from "./env";

type FlutterwaveResponse<T> = { status: string; message: string; data: T };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`https://api.flutterwave.com/v3${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env("FLUTTERWAVE_SECRET_KEY")}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  const body = await response.json() as FlutterwaveResponse<T>;
  if (!response.ok || body.status !== "success") throw new Error(body.message || "Flutterwave request failed");
  return body.data;
}

export interface PaymentProvider {
  listBanks(): Promise<{ name: string; code: string }[]>;
  resolveBank(bankCode: string, accountNumber: string): Promise<{ account_name: string; account_number: string }>;
  createDestination(name: string, bankCode: string, accountNumber: string, phone: string): Promise<{ subaccount_code: string }>;
  initialize(input: { email: string; amount: number; reference: string; subaccount: string; callbackUrl: string; metadata: Record<string, unknown> }): Promise<{ authorization_url: string }>;
  verify(reference: string): Promise<{ status: string; amount: number; currency: string; reference: string }>;
}

export const flutterwave: PaymentProvider = {
  listBanks: () => request("/banks/NG"),
  resolveBank: (bankCode, accountNumber) => request("/accounts/resolve", {
    method: "POST",
    body: JSON.stringify({ account_bank: bankCode, account_number: accountNumber }),
  }),
  createDestination: async (name, bankCode, accountNumber, phone) => {
    const destination = await request<{ subaccount_id: string; account_bank: string; account_number: string }>("/subaccounts", {
      method: "POST",
      body: JSON.stringify({
        account_bank: bankCode,
        account_number: accountNumber,
        business_name: name,
        business_mobile: phone,
        country: "NG",
        split_type: "percentage",
        split_value: 0,
      }),
    });
    if (destination.account_bank !== bankCode || destination.account_number !== accountNumber || !destination.subaccount_id) {
      throw new Error("Flutterwave returned a different payout destination.");
    }
    return { subaccount_code: destination.subaccount_id };
  },
  initialize: async (input) => {
    const checkout = await request<{ link: string }>("/payments", {
      method: "POST",
      body: JSON.stringify({
        tx_ref: input.reference,
        amount: input.amount / 100,
        currency: "NGN",
        redirect_url: input.callbackUrl,
        customer: { email: input.email },
        subaccounts: [{ id: input.subaccount }],
        meta: input.metadata,
      }),
    });
    if (!checkout.link) throw new Error("Flutterwave did not return a checkout link.");
    return { authorization_url: checkout.link };
  },
  verify: async (reference) => {
    const payment = await request<{ status: string; amount: number; currency: string; tx_ref: string }>(`/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`);
    return { status: payment.status, amount: payment.amount, currency: payment.currency, reference: payment.tx_ref };
  },
};
