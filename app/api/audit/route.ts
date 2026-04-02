import { NextRequest, NextResponse } from "next/server";
import { runAudit } from "@/lib/pagespeed";

// In-memory rate limiter — max 5 requests per IP per hour
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

function isValidUrl(input: string): boolean {
  try {
    const url = new URL(input);
    return ["http:", "https:"].includes(url.protocol) && !["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded. Max 5 audits per hour." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const url: string = body?.url?.trim();

  if (!url || !isValidUrl(url)) {
    return NextResponse.json({ error: "Please enter a valid public URL (https://example.com)." }, { status: 400 });
  }

  try {
    const result = await runAudit(url);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Audit error:", err);
    return NextResponse.json({ error: "Could not audit this URL. Make sure it's publicly accessible." }, { status: 500 });
  }
}
