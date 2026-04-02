"use client";

import { useState } from "react";
import type { AuditResult } from "@/lib/pagespeed";
import ScoreCard from "@/components/ScoreCard";
import VitalsTable from "@/components/VitalsTable";
import SEOChecklist from "@/components/SEOChecklist";
import IssueCard from "@/components/IssueCard";
import EmailCapture from "@/components/EmailCapture";

type AuditState = "idle" | "loading" | "done" | "error";

export default function Home() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<AuditState>("idle");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setResult(null);
    setErrorMsg("");

    const res = await fetch("/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.trim() }),
    });

    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error ?? "Something went wrong.");
      setState("error");
    } else {
      setResult(data);
      setState("done");
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <div className="mx-auto max-w-3xl px-4 py-20">

        {/* Header */}
        <div className="mb-12 text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-neutral-800 px-3 py-1 text-xs font-medium uppercase tracking-widest text-neutral-500">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-neutral-500" />
            Free Site Audit
          </p>
          <h1 className="text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">
            See what&apos;s holding<br />your site back.
          </h1>
          <p className="mt-4 text-neutral-400">
            Free instant audit — speed, SEO, and mobile performance.
          </p>
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="mb-12">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://yourbusiness.com"
              className="flex-1 border border-neutral-800 bg-neutral-900 px-5 py-4 text-sm text-white placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
            />
            <button
              type="submit"
              disabled={state === "loading"}
              className="border border-white bg-white px-8 py-4 text-sm font-bold uppercase tracking-widest text-neutral-900 transition-colors hover:bg-neutral-200 disabled:opacity-50"
            >
              {state === "loading" ? "Auditing..." : "Run Audit"}
            </button>
          </div>
          {state === "error" && (
            <p className="mt-3 text-sm text-red-400">{errorMsg}</p>
          )}
        </form>

        {/* Loading */}
        {state === "loading" && (
          <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 border border-neutral-800 bg-neutral-900" />
              ))}
            </div>
            <div className="h-40 border border-neutral-800 bg-neutral-900" />
            <div className="h-32 border border-neutral-800 bg-neutral-900" />
          </div>
        )}

        {/* Results */}
        {state === "done" && result && (
          <div className="space-y-10">

            {/* Scores */}
            <section>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">Scores</p>
              <div className="grid grid-cols-3 gap-3">
                <ScoreCard label="Performance" score={result.scores.performance} />
                <ScoreCard label="SEO" score={result.scores.seo} />
                <ScoreCard label="Mobile" score={result.scores.mobile} />
              </div>
            </section>

            {/* Core Web Vitals */}
            <section>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">Core Web Vitals</p>
              <VitalsTable vitals={result.vitals} />
            </section>

            {/* SEO Checks */}
            <section>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">SEO Checks</p>
              <SEOChecklist seo={result.seo} />
            </section>

            {/* Top Issues */}
            {result.opportunities.length > 0 && (
              <section>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">Top Issues</p>
                <div className="space-y-3">
                  {result.opportunities.map((issue) => (
                    <IssueCard key={issue.id} issue={issue} />
                  ))}
                </div>
              </section>
            )}

            {/* Email Capture */}
            <section>
              <EmailCapture audit={result} />
            </section>

            {/* CTA */}
            <section className="border-t border-neutral-800 pt-8 text-center">
              <p className="text-sm text-neutral-500 mb-4">Want these issues fixed?</p>
              <a
                href="https://jakwoun.me/build"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-white bg-white px-6 py-3 text-sm font-bold uppercase tracking-widest text-neutral-900 transition-colors hover:bg-neutral-200"
              >
                See Web Dev Packages →
              </a>
            </section>

          </div>
        )}

        {/* Footer */}
        <footer className="mt-20 border-t border-neutral-900 pt-8 text-center">
          <p className="text-xs text-neutral-700">
            SiteCheck by{" "}
            <a href="https://jakwoun.me" className="hover:text-neutral-500 transition-colors">
              jakwoun.me
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
