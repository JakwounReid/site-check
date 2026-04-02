import type { AuditResult } from "@/lib/pagespeed";

interface VitalsTableProps {
  vitals: AuditResult["vitals"];
}

const benchmarks: Record<string, string> = {
  LCP: "≤ 2.5s",
  CLS: "≤ 0.1",
  INP: "≤ 200ms",
};

function badgeClass(score: "pass" | "average" | "fail") {
  if (score === "pass") return "bg-green-950/50 text-green-400 border border-green-500/30";
  if (score === "average") return "bg-yellow-950/50 text-yellow-400 border border-yellow-500/30";
  return "bg-red-950/50 text-red-400 border border-red-500/30";
}

function badgeLabel(score: "pass" | "average" | "fail") {
  if (score === "pass") return "Pass";
  if (score === "average") return "Needs Work";
  return "Fail";
}

export default function VitalsTable({ vitals }: VitalsTableProps) {
  const rows = [
    { label: "LCP", subtitle: "Largest Contentful Paint", ...vitals.lcp },
    { label: "CLS", subtitle: "Cumulative Layout Shift", ...vitals.cls },
    { label: "INP", subtitle: "Interaction to Next Paint", ...vitals.inp },
  ];

  return (
    <div className="divide-y divide-neutral-800 border border-neutral-800">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between px-5 py-4">
          <div>
            <span className="font-bold text-white">{row.label}</span>
            <span className="ml-2 text-xs text-neutral-500">{row.subtitle}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-400">{row.displayValue}</span>
            <span className="text-xs text-neutral-600">{benchmarks[row.label]}</span>
            <span className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badgeClass(row.score)}`}>
              {badgeLabel(row.score)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
