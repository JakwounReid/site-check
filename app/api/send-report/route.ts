import { NextRequest, NextResponse } from "next/server";
import { sendAuditReport } from "@/lib/email";
import type { AuditResult } from "@/lib/pagespeed";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email: string = body?.email?.trim();
  const audit: AuditResult = body?.audit;

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  if (!audit?.url) {
    return NextResponse.json({ error: "No audit data provided." }, { status: 400 });
  }

  try {
    await sendAuditReport(email, audit);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Email error:", err);
    return NextResponse.json({ error: "Failed to send email. Please try again." }, { status: 500 });
  }
}
