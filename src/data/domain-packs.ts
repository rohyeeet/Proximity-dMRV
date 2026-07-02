import type { DomainPack } from "@/types";

export const domainPacks: DomainPack[] = [
  {
    id: "pack-biochar-isometric",
    slug: "biochar-isometric",
    name: "Biochar — Isometric & Puro",
    version: "v3",
    status: "published",
    description:
      "Feedstock through production, lab, dispatch, and end-use for engineered biochar removals under Isometric or Puro.",
  },
  {
    id: "pack-green-hydrogen",
    slug: "green-hydrogen",
    name: "Green Hydrogen — Electrolysis to Certification",
    version: "v1",
    status: "published",
    description:
      "Electrolyzer setup, renewable sourcing, production, carrier conversion, transport, and GO certification for renewable hydrogen.",
    chainOfCustodyModes: ["mass_balance", "book_and_claim"],
    defaultChainOfCustodyMode: "mass_balance",
  },
];

export function getDomainPack(id: string): DomainPack | undefined {
  return domainPacks.find((pack) => pack.id === id);
}
