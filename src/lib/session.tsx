"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { organizations, roles, users } from "@/data";
import type { CurrentSession, Organization } from "@/types";

interface SessionContextValue {
  session: CurrentSession;
  organizations: Organization[];
  setActiveOrganizationId: (organizationId: string) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const PLATFORM_USER_ID = "user-rohit";
const DEFAULT_ORGANIZATION_ID = "org-varaha-south";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [activeOrganizationId, setActiveOrganizationId] = useState(DEFAULT_ORGANIZATION_ID);

  const session = useMemo<CurrentSession>(() => {
    const organization = organizations.find((org) => org.id === activeOrganizationId) ?? organizations[0]!;
    const user = users.find((candidate) => candidate.id === PLATFORM_USER_ID)!;
    const role = roles.find((candidate) => candidate.id === "role-super-admin")!;
    return { user, organization, role, isPlatformAdmin: true };
  }, [activeOrganizationId]);

  const value = useMemo<SessionContextValue>(
    () => ({ session, organizations, setActiveOrganizationId }),
    [session]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
