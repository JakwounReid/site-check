import { Hono } from "hono";
import type { AuditResult } from "../lib/pagespeed";
import { sendAuditReport } from "../lib/email";

const report = new Hono<{ Bindings: Env }>();

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

report.post("/", async (c) => {
  const body = await c.req
    .json<{ email?: string; audit?: AuditResult }>()
    .catch(() => null);

  const email = body?.email?.trim() ?? "";
  const audit = body?.audit;

  if (!email || !isValidEmail(email)) {
    return c.json({ error: "Please enter a valid email address." }, 400);
  }

  if (!audit?.url) {
    return c.json({ error: "No audit data provided." }, 400);
  }

  try {
    await sendAuditReport(email, audit, c.env);
    return c.json({ success: true });
  } catch (err) {
    console.error("Email error:", err);
    return c.json({ error: "Failed to send email. Please try again." }, 500);
  }
});

export default report;
