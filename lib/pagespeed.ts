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
    performance: number | null;
    seo: number | null;
    mobile: number | null;
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

async function fetchSeoFromHtml(url: string): Promise<Pick<AuditResult["seo"], "title" | "description" | "viewport">> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SiteCheck/1.0)" },
      signal: AbortSignal.timeout(10000),
    });
    const html = await res.text();
    return {
      title: /<title[\s>][^<]*\S/i.test(html),
      description: /<meta[^>]+name=["']description["'][^>]+content=["'][^"']+["']/i.test(html) ||
                   /<meta[^>]+content=["'][^"']+["'][^>]+name=["']description["']/i.test(html),
      viewport: /<meta[^>]+name=["']viewport["']/i.test(html) ||
                /<meta[^>]+content=["'][^"']*width[^"']*["'][^>]+name=["']viewport["']/i.test(html),
    };
  } catch {
    return { title: false, description: false, viewport: false };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseAudits(audits: Record<string, any>): {
  vitals: AuditResult["vitals"];
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

  return { vitals, opportunities };
}

async function fetchStrategy(url: string, strategy: "mobile" | "desktop") {
  const apiKey = process.env.PAGESPEED_API_KEY;
  const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("strategy", strategy);
  endpoint.searchParams.append("category", "performance");
  endpoint.searchParams.append("category", "seo");
  if (apiKey) endpoint.searchParams.set("key", apiKey);

  const res = await fetch(endpoint.toString(), { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`PageSpeed API error: ${res.status}`);
  return res.json();
}

export async function runAudit(url: string): Promise<AuditResult> {
  const baseUrl = new URL(url).origin;

  const [mobile, desktop, htmlSeo, sitemapRes, robotsRes] = await Promise.all([
    fetchStrategy(url, "mobile"),
    fetchStrategy(url, "desktop"),
    fetchSeoFromHtml(url),
    fetch(`${baseUrl}/sitemap.xml`, { method: "HEAD" }).catch(() => null),
    fetch(`${baseUrl}/robots.txt`, { method: "HEAD" }).catch(() => null),
  ]);

  const desktopAudits = desktop.lighthouseResult?.audits ?? {};
  const mobileCategories = mobile.lighthouseResult?.categories ?? {};
  const desktopCategories = desktop.lighthouseResult?.categories ?? {};

  const { vitals, opportunities } = parseAudits(desktopAudits);

  return {
    url,
    scores: {
      performance: desktopCategories.performance?.score != null ? Math.round(desktopCategories.performance.score * 100) : null,
      seo: desktopCategories.seo?.score != null ? Math.round(desktopCategories.seo.score * 100) : null,
      mobile: mobileCategories.performance?.score != null ? Math.round(mobileCategories.performance.score * 100) : null,
    },
    vitals,
    seo: {
      ...htmlSeo,
      sitemap: sitemapRes?.ok ?? false,
      robots: robotsRes?.ok ?? false,
    },
    opportunities,
  };
}
