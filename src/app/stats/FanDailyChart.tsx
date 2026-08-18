"use client";

import { useState } from "react";
import { formatCompact } from "@/lib/stats-format";
import type { DailyFanMetrics } from "@/lib/fan-accounts";
import { th, td, tdMuted } from "./ui";

const CHART_HEIGHT = 128;

function Sparkline({ label, data, accessor }: { label: string; data: DailyFanMetrics[]; accessor: (d: DailyFanMetrics) => number }) {
  const values = data.map(accessor);
  const max = Math.max(1, ...values);
  const total = values.reduce((a, b) => a + b, 0);
  return (
    <div className="rounded-lg border border-white/10 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-[#82806F]">{label}</p>
      <p className="mt-1 text-lg font-bold text-[#F3ECDD]">{formatCompact(total)}</p>
      <div className="mt-2 flex h-10 items-end gap-[2px]">
        {values.map((v, i) => (
          <div key={i} className="min-w-0 flex-1 rounded-t-sm bg-[#82806F]/60" style={{ height: `${Math.max(4, (v / max) * 100)}%` }} />
        ))}
      </div>
    </div>
  );
}

export function FanDailyChart({ data }: { data: DailyFanMetrics[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const maxViews = Math.max(1, ...data.map((d) => d.views));
  const totalViews = data.reduce((sum, d) => sum + d.views, 0);
  const totalLikes = data.reduce((sum, d) => sum + d.likes, 0);
  const totalComments = data.reduce((sum, d) => sum + d.comments, 0);

  const active = activeIndex !== null ? data[activeIndex] : null;

  return (
    <div>
      <div className="rounded-lg border border-white/10 p-4">
        <div className="flex items-baseline justify-between">
          <p className="text-xs font-bold uppercase tracking-wide text-[#82806F]">Views per day</p>
          {active ? (
            <p className="text-xs text-[#B9B6A6]">
              <span className="font-bold text-[#F3ECDD]">{active.date}</span> — {formatCompact(active.views)} views ·{" "}
              {formatCompact(active.likes)} likes · {formatCompact(active.comments)} comments
            </p>
          ) : (
            <p className="text-xs text-[#B9B6A6]">
              {data.length}-day totals — <span className="font-bold text-[#F3ECDD]">{formatCompact(totalViews)}</span> views ·{" "}
              {formatCompact(totalLikes)} likes · {formatCompact(totalComments)} comments
            </p>
          )}
        </div>

        <div className="mt-4 flex items-end gap-[2px]" style={{ height: CHART_HEIGHT }}>
          {data.map((d, i) => (
            <button
              key={d.date}
              type="button"
              onMouseEnter={() => setActiveIndex(i)}
              onFocus={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
              onBlur={() => setActiveIndex(null)}
              aria-label={`${d.date}: ${d.views} views, ${d.likes} likes, ${d.comments} comments`}
              className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-1 rounded-sm outline-none"
              style={{ height: CHART_HEIGHT }}
            >
              <div
                className={`w-full rounded-t-sm transition-[filter] ${activeIndex === i ? "bg-[#FF9100] brightness-125" : "bg-[#FF9100]"} group-focus-visible:ring-2 group-focus-visible:ring-[#F3ECDD]`}
                style={{ height: `${Math.max(1, (d.views / maxViews) * 100)}%` }}
              />
            </button>
          ))}
        </div>
        <div className="mt-1 flex gap-[2px]">
          {data.map((d, i) => (
            <div key={d.date} className="min-w-0 flex-1 text-center text-[10px] text-[#82806F]">
              {i % 2 === 0 || data.length <= 10 ? d.date : ""}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Sparkline label="Likes per day" data={data} accessor={(d) => d.likes} />
        <Sparkline label="Comments per day" data={data} accessor={(d) => d.comments} />
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-bold uppercase tracking-wide text-[#82806F] transition-colors hover:text-[#B9B6A6]">
          View as table
        </summary>
        <div className="mt-2 overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full min-w-[420px] border-collapse">
            <thead className="bg-white/5">
              <tr>
                <th className={th}>Date</th>
                <th className={th}>Views</th>
                <th className={th}>Likes</th>
                <th className={th}>Comments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[...data].reverse().map((d) => (
                <tr key={d.date}>
                  <td className={td}>{d.date}</td>
                  <td className={tdMuted}>{d.views.toLocaleString()}</td>
                  <td className={tdMuted}>{d.likes.toLocaleString()}</td>
                  <td className={tdMuted}>{d.comments.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
