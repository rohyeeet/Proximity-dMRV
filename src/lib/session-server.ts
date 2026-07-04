import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toOrganization, toRole, toUser } from "@/lib/mappers";
import type { Organization, Role, User } from "@/types";

/**
 * Server-side session + org/role resolution shared by every authenticated layout
 * ((app)/layout.tsx and collect/layout.tsx) — extracted so both routes resolve
 * "who is this, which orgs can they see, in what role" identically instead of
 * duplicating the auth/membership lookup.
 */
export async function resolveSession(): Promise<{
  user: User;
  accessibleOrgs: { organization: Organization; role: Role }[];
  initialActiveOrganizationId: string;
}> {
  const authSession = await auth();
  if (!authSession?.user?.id) redirect("/login");

  const userRow = await prisma.user.findUnique({ where: { id: authSession.user.id } });
  if (!userRow || userRow.status !== "active") redirect("/login");

  const user = toUser(userRow);
  const accessibleOrgs: { organization: Organization; role: Role }[] = [];

  if (user.isPlatformAdmin) {
    const [orgRows, platformRoleRow] = await Promise.all([
      prisma.organization.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.role.findFirst({ where: { tier: "platform" } }),
    ]);
    if (!platformRoleRow) redirect("/login");
    const platformRole = toRole(platformRoleRow);
    for (const orgRow of orgRows) {
      accessibleOrgs.push({ organization: toOrganization(orgRow), role: platformRole });
    }
  } else {
    const memberships = await prisma.orgMembership.findMany({
      where: { userId: user.id, status: "active" },
      include: { organization: true, role: true },
    });
    for (const membership of memberships) {
      accessibleOrgs.push({ organization: toOrganization(membership.organization), role: toRole(membership.role) });
    }
  }

  if (accessibleOrgs.length === 0) redirect("/login");

  const cookieStore = await cookies();
  const preferredOrgId = cookieStore.get("activeOrganizationId")?.value;
  const initialActiveOrganizationId =
    accessibleOrgs.find((entry) => entry.organization.id === preferredOrgId)?.organization.id ?? accessibleOrgs[0]!.organization.id;

  return { user, accessibleOrgs, initialActiveOrganizationId };
}
