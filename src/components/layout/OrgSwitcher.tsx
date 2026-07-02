"use client";

import { ChevronDown } from "lucide-react";
import { useSession } from "@/lib/session";
import { domainPacks } from "@/data";

export function OrgSwitcher() {
  const { session, organizations, setActiveOrganizationId } = useSession();
  const domainPack = domainPacks.find((pack) => pack.id === session.organization.domainPackId);

  return (
    <div className="relative">
      <select
        aria-label="Switch organization"
        value={session.organization.id}
        onChange={(event) => setActiveOrganizationId(event.target.value)}
        className="h-9 appearance-none rounded-md border border-border-strong bg-surface pl-3 pr-8 text-[13px] font-medium text-ink"
      >
        {organizations.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-soft" />
      {domainPack && <span className="ml-2 text-[13px] text-ink-soft">{domainPack.name}</span>}
    </div>
  );
}
