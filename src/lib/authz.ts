import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canEditStudio, canDeleteStage, canReview, canManageTeam } from "@/lib/permissions";
import type { RoleTier } from "@/types";

type AccessResult = { ok: true; userId: string } | { ok: false; status: 401 | 403; message: string };

/**
 * Server-side authorization for Studio mutations — the client hides edit affordances for
 * non-editors, but that's a UX nicety, not security. Every mutating route re-checks here,
 * since hiding a button client-side never stops a direct API request.
 */
export async function requireStudioEditAccess(domainPackId: string): Promise<AccessResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, status: 401, message: "Not authenticated" };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.status !== "active") {
    return { ok: false, status: 401, message: "Not authenticated" };
  }

  if (user.isPlatformAdmin) {
    return { ok: true, userId: user.id };
  }

  const memberships = await prisma.orgMembership.findMany({
    where: { userId: user.id, status: "active", organization: { domainPackId } },
    include: { role: true },
  });
  const canEdit = memberships.some((membership) => canEditStudio(membership.role.tier as RoleTier));

  if (!canEdit) {
    return { ok: false, status: 403, message: "You don't have edit access for this domain pack" };
  }
  return { ok: true, userId: user.id };
}

/** View-only check: any active membership in the org (or platform admin) is enough to read its data. */
export async function requireOrgAccess(organizationId: string): Promise<AccessResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, status: 401, message: "Not authenticated" };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.status !== "active") {
    return { ok: false, status: 401, message: "Not authenticated" };
  }
  if (user.isPlatformAdmin) {
    return { ok: true, userId: user.id };
  }

  const membership = await prisma.orgMembership.findFirst({
    where: { userId: user.id, organizationId, status: "active" },
  });
  if (!membership) {
    return { ok: false, status: 403, message: "You don't have access to this organization" };
  }
  return { ok: true, userId: user.id };
}

/** Same shape as requireStudioEditAccess but keyed directly by organizationId (connectors aren't domain-pack scoped). */
export async function requireOrgEditAccess(organizationId: string): Promise<AccessResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, status: 401, message: "Not authenticated" };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.status !== "active") {
    return { ok: false, status: 401, message: "Not authenticated" };
  }

  if (user.isPlatformAdmin) {
    return { ok: true, userId: user.id };
  }

  const membership = await prisma.orgMembership.findFirst({
    where: { userId: user.id, organizationId, status: "active" },
    include: { role: true },
  });
  if (!membership || !canEditStudio(membership.role.tier as RoleTier)) {
    return { ok: false, status: 403, message: "You don't have edit access for this organization" };
  }
  return { ok: true, userId: user.id };
}

/** Stricter than requireStudioEditAccess — stage deletion is irreversible, so only admin-tier roles pass. */
export async function requireStageDeleteAccess(domainPackId: string): Promise<AccessResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, status: 401, message: "Not authenticated" };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.status !== "active") {
    return { ok: false, status: 401, message: "Not authenticated" };
  }

  if (user.isPlatformAdmin) {
    return { ok: true, userId: user.id };
  }

  const memberships = await prisma.orgMembership.findMany({
    where: { userId: user.id, status: "active", organization: { domainPackId } },
    include: { role: true },
  });
  const canDelete = memberships.some((membership) => canDeleteStage(membership.role.tier as RoleTier));

  if (!canDelete) {
    return { ok: false, status: 403, message: "Only an admin can delete a stage" };
  }
  return { ok: true, userId: user.id };
}

/** Any active member of an org using this domain pack can submit real field data — the Collect
 * app's equivalent of requireOrgAccess, just keyed by domain pack since the caller doesn't send
 * their org id (it's resolved from their own membership, not trusted from the client). */
export async function requireFormCollectAccess(domainPackId: string): Promise<AccessResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, status: 401, message: "Not authenticated" };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.status !== "active") {
    return { ok: false, status: 401, message: "Not authenticated" };
  }

  if (user.isPlatformAdmin) {
    return { ok: true, userId: user.id };
  }

  const membership = await prisma.orgMembership.findFirst({
    where: { userId: user.id, status: "active", organization: { domainPackId } },
  });
  if (!membership) {
    return { ok: false, status: 403, message: "You don't have access to this domain pack" };
  }
  return { ok: true, userId: user.id };
}

/** Approve/return-for-correction is a reviewer-or-above capability. */
export async function requireReviewAccess(domainPackId: string): Promise<AccessResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, status: 401, message: "Not authenticated" };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.status !== "active") {
    return { ok: false, status: 401, message: "Not authenticated" };
  }

  if (user.isPlatformAdmin) {
    return { ok: true, userId: user.id };
  }

  const memberships = await prisma.orgMembership.findMany({
    where: { userId: user.id, status: "active", organization: { domainPackId } },
    include: { role: true },
  });
  const canDoReview = memberships.some((membership) => canReview(membership.role.tier as RoleTier));

  if (!canDoReview) {
    return { ok: false, status: 403, message: "Only a reviewer can approve or return a submission" };
  }
  return { ok: true, userId: user.id };
}

/** Same reviewer-or-above check as requireReviewAccess, but keyed to one specific organization
 * instead of "any org on this domain pack" — for actions (like CSV export) that read/return one
 * particular org's data and must not be satisfied by reviewer status in a sibling org sharing the
 * same domain pack. */
export async function requireReviewAccessForOrganization(organizationId: string): Promise<AccessResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, status: 401, message: "Not authenticated" };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.status !== "active") {
    return { ok: false, status: 401, message: "Not authenticated" };
  }

  if (user.isPlatformAdmin) {
    return { ok: true, userId: user.id };
  }

  const membership = await prisma.orgMembership.findFirst({
    where: { userId: user.id, organizationId, status: "active" },
    include: { role: true },
  });
  if (!membership || !canReview(membership.role.tier as RoleTier)) {
    return { ok: false, status: 403, message: "Only a reviewer can export this organization's data" };
  }
  return { ok: true, userId: user.id };
}

/** Inviting/managing team members is org-scoped, not domain-pack-scoped — same shape as
 * requireOrgEditAccess but gated on canManageTeam instead of canEditStudio. */
export async function requireTeamManageAccess(organizationId: string): Promise<AccessResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, status: 401, message: "Not authenticated" };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.status !== "active") {
    return { ok: false, status: 401, message: "Not authenticated" };
  }

  if (user.isPlatformAdmin) {
    return { ok: true, userId: user.id };
  }

  const membership = await prisma.orgMembership.findFirst({
    where: { userId: user.id, organizationId, status: "active" },
    include: { role: true },
  });
  if (!membership || !canManageTeam(membership.role.tier as RoleTier)) {
    return { ok: false, status: 403, message: "Only an admin can manage team members for this organization" };
  }
  return { ok: true, userId: user.id };
}

export async function requirePlatformAdmin(): Promise<AccessResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, status: 401, message: "Not authenticated" };
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.status !== "active" || !user.isPlatformAdmin) {
    return { ok: false, status: 403, message: "Platform admin access required" };
  }
  return { ok: true, userId: user.id };
}
