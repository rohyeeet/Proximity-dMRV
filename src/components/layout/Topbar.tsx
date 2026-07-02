import { Bell } from "lucide-react";
import { OrgSwitcher } from "./OrgSwitcher";

export function Topbar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-6">
      <OrgSwitcher />
      <button aria-label="Notifications" className="relative flex size-8 items-center justify-center rounded-md text-ink-soft hover:bg-sunken">
        <Bell className="size-4" strokeWidth={2} />
        <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-critical-text" />
      </button>
    </header>
  );
}
