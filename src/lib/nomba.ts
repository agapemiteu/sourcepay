import type { PaymentProvider } from "./payments";

// Nomba stays outside the MVP payment path until live API access is approved.
export const nomba: PaymentProvider = {
  listBanks: async () => { throw new Error("NOT_ENABLED"); },
  resolveBank: async () => { throw new Error("NOT_ENABLED"); },
  createDestination: async () => { throw new Error("NOT_ENABLED"); },
  initialize: async () => { throw new Error("NOT_ENABLED"); },
  verify: async () => { throw new Error("NOT_ENABLED"); },
};
