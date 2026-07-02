"use client";

import { SessionProvider } from "@/lib/session";
import { StudioProvider } from "@/lib/studio";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <StudioProvider>
        <div className="flex min-h-screen bg-paper">
          <Sidebar />
          <div className="flex flex-1 flex-col">
            <Topbar />
            <main className="flex-1 overflow-y-auto px-8 py-6">
              <div className="mx-auto max-w-6xl">{children}</div>
            </main>
          </div>
        </div>
      </StudioProvider>
    </SessionProvider>
  );
}
