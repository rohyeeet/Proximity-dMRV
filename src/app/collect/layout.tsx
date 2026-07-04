import { resolveSession } from "@/lib/session-server";
import { getAllFlowTemplates, getAllFormTemplates, getAllStages } from "@/lib/queries";
import { SessionProvider } from "@/lib/session";
import { StudioProvider } from "@/lib/studio";
import { CollectShell } from "@/components/collect/CollectShell";

export default async function CollectLayout({ children }: { children: React.ReactNode }) {
  const { user, accessibleOrgs, initialActiveOrganizationId } = await resolveSession();
  const [initialForms, initialFlows, initialStages] = await Promise.all([getAllFormTemplates(), getAllFlowTemplates(), getAllStages()]);

  return (
    <SessionProvider
      user={user}
      accessibleOrgs={accessibleOrgs}
      isPlatformAdmin={user.isPlatformAdmin ?? false}
      initialActiveOrganizationId={initialActiveOrganizationId}
    >
      <StudioProvider initialForms={initialForms} initialFlows={initialFlows} initialStages={initialStages}>
        <CollectShell>{children}</CollectShell>
      </StudioProvider>
    </SessionProvider>
  );
}
