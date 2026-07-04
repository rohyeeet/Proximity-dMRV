"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { Role, User } from "@/types";

const inputClass = "w-full rounded-md border border-border-strong bg-paper px-2.5 py-1.5 text-[13.5px] text-ink placeholder:text-ink-soft/60";
const labelClass = "mb-1 block text-[12px] font-medium text-ink-soft";

export function InviteUserModal({
  open,
  onClose,
  organizationId,
  roles,
  onInvited,
}: {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  roles: Role[];
  onInvited: (result: { user: User; role: Role; tempPassword: string | null }) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [roleId, setRoleId] = useState(roles[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setFullName("");
    setEmail("");
    setMobileNumber("");
    setCountry("");
    setState("");
    setDistrict("");
    setRoleId(roles[0]?.id ?? "");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !roleId) {
      setError("Full name, email, and role are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/organizations/${organizationId}/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: fullName.trim(), email: email.trim(), mobileNumber, country, state, district, roleId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to invite user");
      }
      const result = await res.json();
      onInvited(result);
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite user");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Invite user"
      description="Onboard someone with real access to this organization."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {error && <p className="rounded-md border border-critical-text/30 bg-critical-bg px-3 py-2 text-[13px] text-critical-text">{error}</p>}

        <div>
          <label className={labelClass}>Full name</label>
          <input autoFocus value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Priya Nair" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Mobile number</label>
          <input value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} placeholder="+91 98765 43210" className={inputClass} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className={labelClass}>Country</label>
            <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="India" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>State</label>
            <input value={state} onChange={(e) => setState(e.target.value)} placeholder="Karnataka" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>District</label>
            <input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Mysuru" className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Role</label>
          <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className={inputClass}>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Inviting…" : "Invite"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
