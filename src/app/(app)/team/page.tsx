"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { useSession } from "@/lib/session";
import { canManageTeam } from "@/lib/permissions";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { InviteUserModal } from "@/components/team/InviteUserModal";
import type { OrgMembership, Role, User } from "@/types";

const tierLabel: Record<string, string> = {
  org_admin: "Org Admin",
  org_sub_admin: "Org Sub-Admin",
  designer: "Designer",
  submitter: "Submitter",
  reviewer: "Reviewer",
  viewer: "Viewer",
};

interface MemberRow {
  membership: OrgMembership;
  user: User;
  role: Role;
}

export default function TeamPage() {
  const { session } = useSession();
  const canInvite = canManageTeam(session.role.tier);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [orgRoles, setOrgRoles] = useState<Role[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [justInvited, setJustInvited] = useState<{ name: string; tempPassword: string } | null>(null);

  function loadTeam() {
    fetch(`/api/organizations/${session.organization.id}/team`)
      .then((res) => res.json())
      .then((data: { members: MemberRow[]; roles: Role[] }) => {
        setMembers(data.members);
        setOrgRoles(data.roles);
      })
      .catch((error) => console.error("Failed to load team", error));
  }

  useEffect(() => {
    loadTeam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.organization.id]);

  const columns: DataTableColumn<MemberRow>[] = [
    {
      key: "name",
      header: "Name",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-full bg-sunken text-[10px] font-semibold text-ink">{row.user?.avatarInitials}</div>
          <span className="font-medium text-ink">{row.user?.fullName}</span>
        </div>
      ),
    },
    { key: "email", header: "Email", render: (row) => <span className="text-ink-soft">{row.user?.email}</span> },
    { key: "role", header: "Role", render: (row) => <span className="text-ink-soft">{row.role?.name}</span> },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <StatusChip
          label={row.membership.status}
          tone={row.membership.status === "active" ? "good" : row.membership.status === "invited" ? "accent" : "critical"}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow={session.organization.name}
        title="Team & Access"
        description="Custom roles composed from the platform's five permission primitives, scoped to whatever projects an Org Admin decides."
        actions={
          canInvite ? (
            <Button variant="primary" onClick={() => setShowInvite(true)} disabled={orgRoles.length === 0}>
              Invite user
            </Button>
          ) : undefined
        }
      />

      {canInvite && (
        <InviteUserModal
          open={showInvite}
          onClose={() => setShowInvite(false)}
          organizationId={session.organization.id}
          roles={orgRoles}
          onInvited={({ user, tempPassword }) => {
            loadTeam();
            if (tempPassword) setJustInvited({ name: user.fullName, tempPassword });
          }}
        />
      )}

      {justInvited && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-brand-500/30 bg-brand-50 p-4">
          <KeyRound className="mt-0.5 size-4 shrink-0 text-brand-600" />
          <div className="flex-1">
            <p className="text-[13px] font-medium text-brand-700">
              {justInvited.name} is set up — share this temporary password with them directly (it won&apos;t be shown again):
            </p>
            <p className="mt-1 font-mono text-[14px] font-semibold text-ink">{justInvited.tempPassword}</p>
          </div>
          <button onClick={() => setJustInvited(null)} className="text-[12px] text-brand-600 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-ink-soft">Members</h2>
      <DataTable columns={columns} rows={members} rowKey={(row) => row.membership.id} />

      <h2 className="mb-3 mt-8 text-[13px] font-semibold uppercase tracking-wide text-ink-soft">Roles</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {orgRoles.map((role) => (
          <Link
            key={role.id}
            href={`/team/roles/${role.id}`}
            className="flex flex-col gap-1.5 rounded-lg border border-border bg-surface px-4 py-3.5 hover:border-border-strong hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="font-medium text-ink">{role.name}</p>
              <StatusChip label={tierLabel[role.tier] ?? role.tier} tone="accent" />
            </div>
            <p className="text-[13px] text-ink-soft">{role.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
