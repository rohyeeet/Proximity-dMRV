import { resolveSession } from "@/lib/session-server";
import { getAllFlowTemplates, getAllFormTemplates, getAllStages } from "@/lib/queries";
import { SessionProvider } from "@/lib/session";
import { StudioProvider } from "@/lib/studio";
import { CollectShell } from "@/components/collect/CollectShell";

export default async function CollectLayout({ children }: { children: React.ReactNode }) {
  const { user, accessibleOrgs, initialActiveOrganizationId } = await resolveSession();
  // Scoped to the currently active org's own domain pack only — same fix as (app)/layout.tsx,
  // this route had the identical cross-org over-fetch bug.
  const activeOrg = accessibleOrgs.find((entry) => entry.organization.id === initialActiveOrganizationId)?.organization ?? accessibleOrgs[0]!.organization;
  const domainPackIds = [activeOrg.domainPackId];
  const [initialForms, initialFlows, initialStages] = await Promise.all([
    getAllFormTemplates(domainPackIds),
    getAllFlowTemplates(domainPackIds),
    getAllStages(domainPackIds),
  ]);

  return (
    <SessionProvider
      user={user}
      accessibleOrgs={accessibleOrgs}
      isPlatformAdmin={user.isPlatformAdmin ?? false}
      initialActiveOrganizationId={initialActiveOrganizationId}
    >
      <StudioProvider key={initialActiveOrganizationId} initialForms={initialForms} initialFlows={initialFlows} initialStages={initialStages}>
        <CollectShell>{children}</CollectShell>
      </StudioProvider>
    </SessionProvider>
  );
}
