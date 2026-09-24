import express from "express";
import cors from "cors";
import { attachIdentity } from "./middleware/auth";
import { publicRouter } from "./routes/public";
import { submissionsRouter } from "./routes/submissions";
import { chatRouter } from "./routes/chat";
import { mediaRouter } from "./routes/media";
import { adminContentRouter } from "./routes/admin-content";
import { adminOpsRouter } from "./routes/admin-ops";
import { adminSettingsRouter } from "./routes/admin-settings";
import { cronRouter } from "./routes/cron";

const app = express();

// Railway (and most PaaS) sit behind a reverse proxy — needed for
// req.ip / X-Forwarded-For to resolve correctly in lib/rate-limit.ts.
app.set("trust proxy", true);

const allowedOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Same-origin tools (curl, the cron workflow, server-to-server calls)
      // send no Origin header at all — allow those; only browser requests
      // carry one, and those are checked against the allowlist.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
  })
);

app.use(express.json());
app.use(attachIdentity);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use(publicRouter);
app.use(submissionsRouter);
app.use(chatRouter);
app.use(mediaRouter);
app.use("/admin", adminContentRouter);
app.use("/admin", adminOpsRouter);
app.use("/admin", adminSettingsRouter);
app.use(cronRouter);

// Centralized error handler — anything thrown/rejected in a route that
// wasn't already caught lands here instead of crashing the process or
// hanging the request.
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled route error", err);
  res.status(500).json({ error: "Internal server error." });
});

const port = Number(process.env.PORT ?? 3002);
app.listen(port, () => {
  console.log(`Backend listening on :${port}`);
});
