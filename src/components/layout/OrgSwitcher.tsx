"use client";

import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { SearchPicker } from "@/components/ui/SearchPicker";
import { StatusChip } from "@/components/ui/StatusChip";
import { domainPacks } from "@/data";
import type { Organization } from "@/types";

const statusTone: Record<Organization["status"], "good" | "warn" | "critical"> = {
  active: "good",
  trial: "warn",
  suspended: "critical",
};

/** Which organization ("partner") you're currently acting as — a searchable picker rather than a
 * bare <select> so this stays usable once someone (e.g. a platform admin) manages many of them,
 * and each row's status is visible so a trial/suspended partner never looks identical to an
 * active one. */
export function OrgSwitcher() {
  const router = useRouter();
  const { session, organizations, setActiveOrganizationId } = useSession();
  const domainPack = domainPacks.find((pack) => pack.id === session.organization.domainPackId);

  function switchTo(id: string) {
    setActiveOrganizationId(id);
    // The Studio store (forms/flows/stages) is scoped server-side to whichever org is active —
    // this forces a fresh server render so it re-fetches for the newly active org instead of
    // continuing to show the previous org's data (see AppShell's key={initialActiveOrganizationId}).
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[12px] font-medium text-ink-soft">Managing</span>
      <div className="w-60">
        <SearchPicker<Organization>
          items={organizations}
          getId={(org) => org.id}
          renderRow={(org) => (
            <span className="flex items-center gap-1.5">
              <span className="truncate">{org.name}</span>
              {org.status !== "active" && <StatusChip label={org.status} tone={statusTone[org.status]} />}
            </span>
          )}
          filter={(org, q) => org.name.toLowerCase().includes(q) || org.slug.toLowerCase().includes(q)}
          value={session.organization.id}
          onChange={(id) => id && switchTo(id)}
          placeholder="Search partners…"
          clearable={false}
        />
      </div>
      {domainPack && <span className="whitespace-nowrap text-[13px] text-ink-soft">{domainPack.name}</span>}
    </div>
  );
}
