export type ChainOfCustodyMode = "mass_balance" | "book_and_claim";

export interface DomainPack {
  id: string;
  slug: string;
  name: string;
  version: string;
  status: "draft" | "published" | "retired";
  description: string;
  chainOfCustodyModes?: ChainOfCustodyMode[];
  defaultChainOfCustodyMode?: ChainOfCustodyMode;
}
