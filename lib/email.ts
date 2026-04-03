import { Resend } from "resend";
import type { AuditResult } from "./pagespeed";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

function scoreColor(score: number | null) {
  if (score >= 90) return "#22c55e";
  if (score >= 50) return "#eab308";
  return "#ef4444";
}

function vitalBadge(status: "pass" | "average" | "fail") {
  if (status === "pass") return { bg: "#14532d", text: "#86efac", label: "Pass" };
  if (status === "average") return { bg: "#713f12", text: "#fde68a", label: "Needs Work" };
  return { bg: "#7f1d1d", text: "#fca5a5", label: "Fail" };
}

export async function sendAuditReport(email: string, audit: AuditResult) {
  const domain = new URL(audit.url).hostname;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#0a0a0a;color:#f5f5f5;font-family:sans-serif;margin:0;padding:0;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">

    <p style="color:#737373;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">Site Audit Report</p>
    <h1 style="font-size:24px;font-weight:900;margin:0 0 4px;color:#fff;">${domain}</h1>
    <p style="color:#737373;font-size:13px;margin:0 0 40px;">${audit.url}</p>

    <!-- Scores -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:40px;">
      <tr>
        ${[
          { label: "Performance", score: audit.scores.performance },
          { label: "SEO", score: audit.scores.seo },
          { label: "Mobile", score: audit.scores.mobile },
        ]
          .map(
            (s) => `
          <td width="33%" style="text-align:center;padding:20px 8px;background:#171717;border:1px solid #262626;">
            <div style="font-size:36px;font-weight:900;color:${scoreColor(s.score)};">${s.score}</div>
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#737373;margin-top:4px;">${s.label}</div>
          </td>`
          )
          .join("")}
      </tr>
    </table>

    <!-- Core Web Vitals -->
    <h2 style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#737373;margin:0 0 16px;">Core Web Vitals</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:40px;border-collapse:collapse;">
      ${[
        { label: "LCP", ...audit.vitals.lcp },
        { label: "CLS", ...audit.vitals.cls },
        { label: "INP", ...audit.vitals.inp },
      ]
        .map((v) => {
          const badge = vitalBadge(v.score);
          return `
        <tr style="border-bottom:1px solid #262626;">
          <td style="padding:12px 0;color:#fff;font-size:13px;">${v.label}</td>
          <td style="padding:12px 0;color:#a3a3a3;font-size:13px;">${v.displayValue}</td>
          <td style="padding:12px 0;text-align:right;">
            <span style="background:${badge.bg};color:${badge.text};font-size:10px;padding:2px 8px;border-radius:2px;font-weight:600;">${badge.label}</span>
          </td>
        </tr>`;
        })
        .join("")}
    </table>

    <!-- SEO Checks -->
    <h2 style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#737373;margin:0 0 16px;">SEO Checks</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:40px;border-collapse:collapse;">
      ${Object.entries({
        "Meta Title": audit.seo.title,
        "Meta Description": audit.seo.description,
        "Viewport Tag": audit.seo.viewport,
        "Sitemap.xml": audit.seo.sitemap,
        "Robots.txt": audit.seo.robots,
      })
        .map(
          ([label, pass]) => `
        <tr style="border-bottom:1px solid #262626;">
          <td style="padding:10px 0;font-size:13px;color:#fff;">${label}</td>
          <td style="padding:10px 0;text-align:right;font-size:13px;">${pass ? "✅" : "❌"}</td>
        </tr>`
        )
        .join("")}
    </table>

    <!-- Top Issues -->
    ${
      audit.opportunities.length > 0
        ? `
    <h2 style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#737373;margin:0 0 16px;">Top Issues</h2>
    ${audit.opportunities
      .map(
        (o) => `
    <div style="background:#171717;border:1px solid #262626;padding:16px;margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <p style="font-weight:700;font-size:13px;margin:0 0 4px;color:#fff;">${o.title}</p>
        <span style="font-size:10px;color:${o.impact === "High" ? "#ef4444" : o.impact === "Medium" ? "#eab308" : "#22c55e"};font-weight:600;margin-left:12px;white-space:nowrap;">${o.impact}</span>
      </div>
      <p style="color:#737373;font-size:12px;margin:0;">${o.description}${o.savings ? ` — Est. savings: ${o.savings}` : ""}</p>
    </div>`
      )
      .join("")}`
        : ""
    }

    <!-- CTA -->
    <div style="margin-top:40px;padding-top:32px;border-top:1px solid #262626;text-align:center;">
      <p style="color:#a3a3a3;font-size:13px;margin:0 0 16px;">Want these issues fixed?</p>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://jakwoun.me"}/build"
         style="background:#fff;color:#0a0a0a;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:1px;padding:12px 28px;text-decoration:none;display:inline-block;">
        See Web Dev Packages →
      </a>
    </div>

    <p style="color:#404040;font-size:11px;margin:40px 0 0;text-align:center;">
      SiteCheck by <a href="https://jakwoun.me" style="color:#404040;">jakwoun.me</a>
    </p>
  </div>
</body>
</html>`;

  return getResend().emails.send({
    from: "SiteCheck <audit@jakwoun.me>",
    to: email,
    subject: `Your Site Audit Report — ${domain}`,
    html,
  });
}
