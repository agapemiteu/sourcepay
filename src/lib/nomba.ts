import type { PaymentProvider } from "./payments";

// Nomba remains outside the MVP payment path.
export const nomba: PaymentProvider = {
  listBanks: async () => { throw new Error("NOT_ENABLED"); },
  resolveBank: async () => { throw new Error("NOT_ENABLED"); },
  createDestination: async () => { throw new Error("NOT_ENABLED"); },
  initialize: async () => { throw new Error("NOT_ENABLED"); },
  verify: async () => { throw new Error("NOT_ENABLED"); },
  createBeneficiary: async () => { throw new Error("NOT_ENABLED"); },
  transfer: async () => { throw new Error("NOT_ENABLED"); },
  findTransfer: async () => { throw new Error("NOT_ENABLED"); },
  refund: async () => { throw new Error("NOT_ENABLED"); },
  findRefund: async () => { throw new Error("NOT_ENABLED"); },
};
