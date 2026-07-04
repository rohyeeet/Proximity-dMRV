import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOrgAccess, requireTeamManageAccess } from "@/lib/authz";
import { toRole, toUser } from "@/lib/mappers";
import { genId } from "@/lib/utils";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await requireOrgAccess(id);
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status });

  const [memberships, roles] = await Promise.all([
    prisma.orgMembership.findMany({ where: { organizationId: id }, include: { user: true, role: true } }),
    prisma.role.findMany({ where: { organizationId: id } }),
  ]);

  return NextResponse.json({
    members: memberships.map((membership) => ({
      membership: { id: membership.id, organizationId: membership.organizationId, userId: membership.userId, roleId: membership.roleId, status: membership.status },
      user: toUser(membership.user),
      role: toRole(membership.role),
    })),
    roles: roles.map(toRole),
  });
}

function deriveAvatarInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((p) => p[0]!.toUpperCase());
  return initials.join("") || "?";
}

function generateTempPassword(): string {
  return randomBytes(9).toString("base64").replace(/[+/=]/g, "").slice(0, 12);
}

/** Real onboarding: creates (or reuses, if the email already has an account) a User and adds them
 * to this org with the chosen role. No email service exists yet, so a temporary password is
 * generated and returned once for the inviting admin to relay directly — there's no self-service
 * invite-acceptance flow in this pass. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await requireTeamManageAccess(id);
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status });

  const body = await request.json();
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const roleId = typeof body.roleId === "string" ? body.roleId : "";
  if (!fullName || !email || !roleId) {
    return NextResponse.json({ error: "Full name, email, and role are required" }, { status: 400 });
  }

  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role || role.organizationId !== id) {
    return NextResponse.json({ error: "That role doesn't belong to this organization" }, { status: 400 });
  }

  let user = await prisma.user.findUnique({ where: { email } });
  let tempPassword: string | null = null;

  if (user) {
    const existingMembership = await prisma.orgMembership.findFirst({ where: { organizationId: id, userId: user.id } });
    if (existingMembership) {
      return NextResponse.json({ error: "This person is already part of this organization" }, { status: 409 });
    }
  } else {
    tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    user = await prisma.user.create({
      data: {
        id: genId("user"),
        fullName,
        email,
        passwordHash,
        avatarInitials: deriveAvatarInitials(fullName),
        status: "active",
        mobileNumber: typeof body.mobileNumber === "string" && body.mobileNumber.trim() ? body.mobileNumber.trim() : null,
        country: typeof body.country === "string" && body.country.trim() ? body.country.trim() : null,
        state: typeof body.state === "string" && body.state.trim() ? body.state.trim() : null,
        district: typeof body.district === "string" && body.district.trim() ? body.district.trim() : null,
      },
    });
  }

  await prisma.orgMembership.create({
    data: { id: genId("membership"), organizationId: id, userId: user.id, roleId, status: "active" },
  });

  return NextResponse.json({ user: toUser(user), role: toRole(role), tempPassword });
}
