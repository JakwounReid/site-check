import type { Opportunity } from "@/lib/pagespeed";

interface IssueCardProps {
  issue: Opportunity;
}

function impactClass(impact: Opportunity["impact"]) {
  if (impact === "High") return "text-red-400 border-red-500/30 bg-red-950/20";
  if (impact === "Medium") return "text-yellow-400 border-yellow-500/30 bg-yellow-950/20";
  return "text-green-400 border-green-500/30 bg-green-950/20";
}

export default function IssueCard({ issue }: IssueCardProps) {
  return (
    <div className="border border-neutral-800 bg-neutral-900 p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-white text-sm leading-snug">{issue.title}</p>
        <span className={`shrink-0 border rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${impactClass(issue.impact)}`}>
          {issue.impact}
        </span>
      </div>
      <p className="mt-2 text-xs text-neutral-500 leading-relaxed">{issue.description}</p>
      {issue.savings && (
        <p className="mt-3 text-xs font-medium text-neutral-400">Est. savings: {issue.savings}</p>
      )}
    </div>
  );
}
