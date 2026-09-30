import { env } from "./env";

type PaystackResponse<T> = { status: boolean; message: string; data: T };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`https://api.paystack.co${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env("PAYSTACK_SECRET_KEY")}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  const body = await response.json() as PaystackResponse<T>;
  if (!response.ok || !body.status) throw new Error(body.message || "Paystack request failed");
  return body.data;
}

export interface PaymentProvider {
  listBanks(): Promise<{ name: string; code: string }[]>;
  resolveBank(bankCode: string, accountNumber: string): Promise<{ account_name: string; account_number: string }>;
  createDestination(name: string, bankCode: string, accountNumber: string): Promise<{ subaccount_code: string }>;
  initialize(input: { email: string; amount: number; reference: string; subaccount: string; callbackUrl: string; metadata: Record<string, unknown> }): Promise<{ authorization_url: string }>;
  verify(reference: string): Promise<{ status: string; amount: number; currency: string; reference: string; subaccount?: { subaccount_code?: string } | string }>;
}

export const paystack: PaymentProvider = {
  listBanks: async () => {
    const banks: { name: string; code: string }[] = [];
    for (let page = 1; page <= 5; page++) {
      const batch = await request<{ name: string; code: string }[]>(`/bank?country=nigeria&perPage=100&page=${page}`);
      banks.push(...batch);
      if (batch.length < 100) break;
    }
    return banks;
  },
  resolveBank: (bankCode, accountNumber) => request(`/bank/resolve?bank_code=${encodeURIComponent(bankCode)}&account_number=${encodeURIComponent(accountNumber)}`),
  createDestination: (name, bankCode, accountNumber) => request("/subaccount", { method: "POST", body: JSON.stringify({ business_name: name, settlement_bank: bankCode, account_number: accountNumber, percentage_charge: 0 }) }),
  initialize: (input) => request("/transaction/initialize", { method: "POST", body: JSON.stringify({ email: input.email, amount: input.amount, currency: "NGN", reference: input.reference, subaccount: input.subaccount, callback_url: input.callbackUrl, metadata: JSON.stringify(input.metadata) }) }),
  verify: (reference) => request(`/transaction/verify/${encodeURIComponent(reference)}`),
};
