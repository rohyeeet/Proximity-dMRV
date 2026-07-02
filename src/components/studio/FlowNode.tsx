import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { flowNodeMetaByType } from "./flow-node-catalog";
import type { FlowNodeType } from "@/types";

export interface FlowNodeData extends Record<string, unknown> {
  label: string;
  nodeType: FlowNodeType;
  detail?: string;
  unlinked?: boolean;
  /** Owned by the stage-sync engine — rendered with a small link badge. */
  fromStage?: boolean;
}

export function FlowNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as FlowNodeData;
  const meta = flowNodeMetaByType[nodeData.nodeType];
  const Icon = meta.icon;
  const isMilestone = nodeData.nodeType === "milestone";

  return (
    <div
      className={cn(
        "w-[220px] rounded-lg border px-3 py-2.5 shadow-sm transition-shadow",
        meta.className,
        selected && "ring-2 ring-brand-500 ring-offset-2 ring-offset-sunken"
      )}
    >
      <Handle type="target" position={Position.Left} className="!size-2 !border-border-strong !bg-surface" />
      <div className="flex items-center gap-2">
        <Icon className={cn("size-3.5 shrink-0", isMilestone ? "text-white" : "text-ink-soft")} strokeWidth={2} />
        <p className={cn("truncate text-[11px] font-medium uppercase tracking-wide", isMilestone ? "text-white/80" : "text-ink-soft")}>
          {meta.label}
        </p>
        {nodeData.fromStage && (
          <span className="ml-auto" title="Synced from a stage">
            <Link2 className="size-3 shrink-0 text-brand-600" />
          </span>
        )}
        {nodeData.unlinked && <span className="ml-auto size-1.5 shrink-0 rounded-full bg-warn-text" title="Not linked to a form yet" />}
      </div>
      <p className={cn("mt-1 text-[13px] font-medium leading-snug", isMilestone ? "text-white" : "text-ink")}>{nodeData.label}</p>
      {nodeData.detail && <p className={cn("mt-0.5 text-[11.5px]", isMilestone ? "text-white/70" : "text-ink-soft")}>{nodeData.detail}</p>}
      <Handle type="source" position={Position.Right} className="!size-2 !border-border-strong !bg-surface" />
    </div>
  );
}
