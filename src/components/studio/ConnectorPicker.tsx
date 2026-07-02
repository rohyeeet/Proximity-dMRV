"use client";

import { MultiSearchPicker } from "@/components/ui/SearchPicker";
import { getConnectorsByOrganization } from "@/data";
import { cn } from "@/lib/utils";
import type { Connector } from "@/types";

const dotToneByStatus: Record<Connector["status"], string> = {
  connected: "bg-good-text",
  degraded: "bg-warn-text",
  disconnected: "bg-critical-text",
};

/** Binds SCADA/PLC/device connectors to a stage so its automation status is visible at a glance. */
export function ConnectorPicker({
  organizationId,
  values,
  onChange,
}: {
  organizationId: string;
  values: string[];
  onChange: (ids: string[]) => void;
}) {
  const candidates = getConnectorsByOrganization(organizationId);

  return (
    <MultiSearchPicker<Connector>
      items={candidates}
      getId={(connector) => connector.id}
      renderRow={(connector) => (
        <span className="inline-flex items-center gap-1.5">
          <span className={cn("size-1.5 rounded-full", dotToneByStatus[connector.status])} />
          {connector.name}
        </span>
      )}
      filter={(connector, q) => connector.name.toLowerCase().includes(q)}
      values={values}
      onChange={onChange}
      placeholder="Bind a connector or device feed…"
      emptyLabel="No connectors set up for this organization"
    />
  );
}
