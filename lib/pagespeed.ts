export interface CoreVital {
  displayValue: string;
  score: "pass" | "average" | "fail";
}

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  impact: "High" | "Medium" | "Low";
  savings?: string;
}

export interface AuditResult {
  url: string;
  scores: {
    performance: number;
    seo: number;
    mobile: number;
  };
  vitals: {
    lcp: CoreVital;
    cls: CoreVital;
    inp: CoreVital;
  };
  seo: {
    title: boolean;
    description: boolean;
    viewport: boolean;
    sitemap: boolean;
    robots: boolean;
  };
  opportunities: Opportunity[];
}

function numericScore(score: number | null): "pass" | "average" | "fail" {
  if (score === null) return "fail";
  if (score >= 0.9) return "pass";
  if (score >= 0.5) return "average";
  return "fail";
}

function impactFromScore(score: number | null): "High" | "Medium" | "Low" {
  if (score === null || score < 0.5) return "High";
  if (score < 0.9) return "Medium";
  return "Low";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseAudits(audits: Record<string, any>): {
  vitals: AuditResult["vitals"];
  seo: Omit<AuditResult["seo"], "sitemap" | "robots">;
  opportunities: Opportunity[];
} {
  const vitals: AuditResult["vitals"] = {
    lcp: {
      displayValue: audits["largest-contentful-paint"]?.displayValue ?? "N/A",
      score: numericScore(audits["largest-contentful-paint"]?.score ?? null),
    },
    cls: {
      displayValue: audits["cumulative-layout-shift"]?.displayValue ?? "N/A",
      score: numericScore(audits["cumulative-layout-shift"]?.score ?? null),
    },
    inp: {
      displayValue:
        audits["interaction-to-next-paint"]?.displayValue ??
        audits["total-blocking-time"]?.displayValue ??
        "N/A",
      score: numericScore(
        audits["interaction-to-next-paint"]?.score ??
          audits["total-blocking-time"]?.score ??
          null
      ),
    },
  };

  const seo = {
    title: audits["document-title"]?.score === 1,
    description: audits["meta-description"]?.score === 1,
    viewport: audits["viewport"]?.score === 1,
  };

  const opportunities: Opportunity[] = Object.values(audits)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((a: any) => a.details?.type === "opportunity" && a.score !== null && a.score < 1)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => (a.score ?? 1) - (b.score ?? 1))
    .slice(0, 3)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((a: any) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      impact: impactFromScore(a.score),
      savings: a.details?.overallSavingsMs
        ? `~${Math.round(a.details.overallSavingsMs)}ms`
        : undefined,
    }));

  return { vitals, seo, opportunities };
}

async function fetchStrategy(url: string, strategy: "mobile" | "desktop") {
  const apiKey = process.env.PAGESPEED_API_KEY;
  const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("strategy", strategy);
  if (apiKey) endpoint.searchParams.set("key", apiKey);

  const res = await fetch(endpoint.toString(), { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`PageSpeed API error: ${res.status}`);
  return res.json();
}

export async function runAudit(url: string): Promise<AuditResult> {
  const [mobile, desktop] = await Promise.all([
    fetchStrategy(url, "mobile"),
    fetchStrategy(url, "desktop"),
  ]);

  const desktopAudits = desktop.lighthouseResult?.audits ?? {};
  const mobileCategories = mobile.lighthouseResult?.categories ?? {};
  const desktopCategories = desktop.lighthouseResult?.categories ?? {};

  const { vitals, seo, opportunities } = parseAudits(desktopAudits);

  // Check sitemap and robots
  const baseUrl = new URL(url).origin;
  const [sitemapRes, robotsRes] = await Promise.allSettled([
    fetch(`${baseUrl}/sitemap.xml`, { method: "HEAD" }),
    fetch(`${baseUrl}/robots.txt`, { method: "HEAD" }),
  ]);

  return {
    url,
    scores: {
      performance: Math.round((desktopCategories.performance?.score ?? 0) * 100),
      seo: Math.round((desktopCategories.seo?.score ?? 0) * 100),
      mobile: Math.round((mobileCategories.performance?.score ?? 0) * 100),
    },
    vitals,
    seo: {
      ...seo,
      sitemap:
        sitemapRes.status === "fulfilled" && sitemapRes.value.ok,
      robots:
        robotsRes.status === "fulfilled" && robotsRes.value.ok,
    },
    opportunities,
  };
}
