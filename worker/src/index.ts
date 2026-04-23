import { Hono } from "hono";

const app = new Hono<{ Bindings: Env }>();

app.get("/health", (c) => c.json({ ok: true, service: "site-check-worker" }));

export default app;
