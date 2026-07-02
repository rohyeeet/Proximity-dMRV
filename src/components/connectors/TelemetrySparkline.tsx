"use client";

import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import type { TelemetryStream } from "@/types";

export function TelemetrySparkline({ stream }: { stream: TelemetryStream }) {
  const isNearThreshold = stream.thresholdHigh !== undefined && stream.latestValue / stream.thresholdHigh > 0.9;

  return (
    <div className="rounded-md border border-border bg-sunken px-3 py-2">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-wide text-ink-soft">{stream.parameterCode.replace(/_/g, " ")}</span>
        <span className={`tabular text-[13px] font-semibold ${isNearThreshold ? "text-warn-text" : "text-ink"}`}>
          {stream.latestValue} {stream.unit}
        </span>
      </div>
      <div className="mt-1 h-12">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={stream.points} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <YAxis hide domain={["auto", "auto"]} />
            <defs>
              <linearGradient id={`spark-${stream.deviceId}-${stream.parameterCode}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2a4cdb" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#2a4cdb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke="#2a4cdb"
              strokeWidth={1.5}
              fill={`url(#spark-${stream.deviceId}-${stream.parameterCode})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
