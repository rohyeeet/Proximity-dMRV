import { NextResponse } from "next/server";
import { requireOrgAccess } from "@/lib/authz";
import { getAnalyticsCards, getAnalyticsSeries } from "@/lib/analytics";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: organizationId } = await params;

  const access = await requireOrgAccess(organizationId);
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status });

  const [cards, series] = await Promise.all([getAnalyticsCards(organizationId), getAnalyticsSeries(organizationId)]);

  return NextResponse.json({ cards, series });
}
