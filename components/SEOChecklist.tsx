import type { AuditResult } from "@/lib/pagespeed";

interface SEOChecklistProps {
  seo: AuditResult["seo"];
}

const labels: Record<keyof AuditResult["seo"], string> = {
  title: "Meta title tag",
  description: "Meta description",
  viewport: "Viewport meta tag",
  sitemap: "sitemap.xml detected",
  robots: "robots.txt detected",
};

export default function SEOChecklist({ seo }: SEOChecklistProps) {
  return (
    <div className="divide-y divide-neutral-800 border border-neutral-800">
      {(Object.keys(labels) as Array<keyof AuditResult["seo"]>).map((key) => (
        <div key={key} className="flex items-center justify-between px-5 py-4">
          <span className="text-sm text-neutral-300">{labels[key]}</span>
          {seo[key] ? (
            <span className="text-xs font-semibold text-green-400">✓ Found</span>
          ) : (
            <span className="text-xs font-semibold text-red-400">✗ Missing</span>
          )}
        </div>
      ))}
    </div>
  );
}
