import { redirect } from "next/navigation";
import { resolveSession } from "@/lib/session-server";
import { getAllFlowTemplates, getAllFormTemplates, getAllStages } from "@/lib/queries";
import { AppShell } from "@/components/layout/AppShell";

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const { user, accessibleOrgs, initialActiveOrganizationId } = await resolveSession();

  // Field submitters get a separate, simpler mobile-first experience (see /collect) instead of
  // the Studio admin platform — this is the only tier that's auto-routed away from it.
  const activeRole = accessibleOrgs.find((entry) => entry.organization.id === initialActiveOrganizationId)?.role;
  if (!user.isPlatformAdmin && activeRole?.tier === "submitter") {
    redirect("/collect");
  }

  const domainPackIds = [...new Set(accessibleOrgs.map((entry) => entry.organization.domainPackId))];
  const [initialForms, initialFlows, initialStages] = await Promise.all([
    getAllFormTemplates(domainPackIds),
    getAllFlowTemplates(domainPackIds),
    getAllStages(domainPackIds),
  ]);

  return (
    <AppShell
      user={user}
      accessibleOrgs={accessibleOrgs}
      isPlatformAdmin={user.isPlatformAdmin ?? false}
      initialActiveOrganizationId={initialActiveOrganizationId}
      initialForms={initialForms}
      initialFlows={initialFlows}
      initialStages={initialStages}
    >
      {children}
    </AppShell>
  );
}
