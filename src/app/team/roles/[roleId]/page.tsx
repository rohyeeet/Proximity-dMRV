import { notFound } from "next/navigation";
import { roles } from "@/data";
import { RoleEditorClient } from "@/components/admin/RoleEditorClient";

export default async function RoleEditorPage({ params }: { params: Promise<{ roleId: string }> }) {
  const { roleId } = await params;
  const role = roles.find((candidate) => candidate.id === roleId);
  if (!role) notFound();

  return <RoleEditorClient role={role} />;
}
