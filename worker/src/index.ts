import { Hono } from "hono";
import audit from "./routes/audit";
import report from "./routes/report";

const app = new Hono<{ Bindings: Env }>();

app.get("/health", (c) => c.json({ ok: true, service: "site-check-worker" }));
app.route("/api/audit", audit);
app.route("/api/send-report", report);

export default app;
