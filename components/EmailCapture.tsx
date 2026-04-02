"use client";

import { useState } from "react";
import type { AuditResult } from "@/lib/pagespeed";

interface EmailCaptureProps {
  audit: AuditResult;
}

export default function EmailCapture({ audit }: EmailCaptureProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const res = await fetch("/api/send-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, audit }),
    });

    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error ?? "Something went wrong.");
      setStatus("error");
    } else {
      setStatus("success");
    }
  }

  if (status === "success") {
    return (
      <div className="border border-green-500/30 bg-green-950/20 p-6 text-center">
        <p className="font-semibold text-green-400">Report sent.</p>
        <p className="mt-1 text-sm text-neutral-500">Check your inbox — the full report is on its way.</p>
      </div>
    );
  }

  return (
    <div className="border border-neutral-800 bg-neutral-900 p-6">
      <p className="font-semibold text-white mb-1">Get this report in your inbox</p>
      <p className="text-sm text-neutral-500 mb-4">A full summary sent straight to you — no account required.</p>
      <form onSubmit={handleSubmit} className="flex gap-2 flex-col sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="bg-white text-neutral-900 px-6 py-2.5 text-sm font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors disabled:opacity-50"
        >
          {status === "loading" ? "Sending..." : "Send Report"}
        </button>
      </form>
      {status === "error" && (
        <p className="mt-2 text-xs text-red-400">{errorMsg}</p>
      )}
    </div>
  );
}
