import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSubmissionsByUser } from "@/lib/queries";

/** The Collect app's own submission history — real data only, scoped to the caller. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const submissions = await getSubmissionsByUser(session.user.id);
  return NextResponse.json(submissions);
}
