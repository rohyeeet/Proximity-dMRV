import { NextResponse } from "next/server";
import { requireOrgAccess } from "@/lib/authz";
import { getRolesByOrganization } from "@/lib/queries";

/** Just the real roles for one organization — used by Flow Studio's node inspector to show job
 * titles instead of raw tier codes. Deliberately separate from `.../team` (which also returns
 * membership rows Studio doesn't need). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: organizationId } = await params;

  const access = await requireOrgAccess(organizationId);
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status });

  const roles = await getRolesByOrganization(organizationId);
  return NextResponse.json(roles);
}
