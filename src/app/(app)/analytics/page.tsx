"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useSession } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { AnalyticsCard, AnalyticsSeries } from "@/types";

export default function AnalyticsPage() {
  const { session } = useSession();
  const [data, setData] = useState<{ cards: AnalyticsCard[]; series: AnalyticsSeries[] } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setFailed(false);
    fetch(`/api/organizations/${session.organization.id}/analytics`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`Request failed: ${res.status}`))))
      .then((result: { cards: AnalyticsCard[]; series: AnalyticsSeries[] }) => {
        if (!cancelled) setData(result);
      })
      .catch((error) => {
        console.error("Failed to load analytics", error);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [session.organization.id]);

  return (
    <div>
      <PageHeader
        eyebrow={session.organization.name}
        title="Analytics"
        description="Computed live from this organization's own submissions and review history."
      />

      {failed && (
        <p className="rounded-lg border border-critical-text/30 bg-critical-bg p-4 text-[13px] text-critical-text">
          Couldn&apos;t load analytics right now. Try refreshing the page.
        </p>
      )}

      {!failed && data === null && <p className="text-[13px] text-ink-soft">Loading…</p>}

      {!failed && data !== null && data.cards.length === 0 && (
        <EmptyState title="No activity yet" description="Analytics will appear here once your team starts submitting real field data." />
      )}

      {data !== null && data.cards.length > 0 && (
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {data.cards.map((card) => (
            <MetricCard key={card.key} card={card} />
          ))}
        </div>
      )}

      {data !== null && data.series.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {data.series.map((s) => (
            <div key={s.key} className="rounded-lg border border-border bg-surface px-5 py-4">
              <h2 className="text-sm font-semibold text-ink">{s.label}</h2>
              <div className="mt-3 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={s.points} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2a4cdb" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#2a4cdb" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#e2e4dc" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#5c6058" }} axisLine={{ stroke: "#e2e4dc" }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#5c6058" }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid #e2e4dc" }}
                      formatter={(value) => [`${value}${s.unit ? ` ${s.unit}` : ""}`, s.label]}
                    />
                    <Area type="monotone" dataKey="value" stroke="#2a4cdb" strokeWidth={2} fill={`url(#fill-${s.key})`} dot={false} activeDot={{ r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
