import express from "express";
import cors, { CorsOptions } from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { env } from "./config/env";
import { updateLastActive } from "./middlewares/activity";
import { errorHandler } from "./middlewares/errorHandler";
import { notFound } from "./middlewares/notFound";
import { requestIdMiddleware } from "./middlewares/requestId";
import routes from "./routes";
import { ensureUploadsDir } from "./services/photoService";

export const app = express();

app.set("trust proxy", 1);

ensureUploadsDir();
if (env.STORAGE_PROVIDER === "local") {
  const uploadsDir = path.join(process.cwd(), "uploads");
  app.use("/uploads", express.static(uploadsDir));
}

app.use(
  helmet({
    hsts:
      env.NODE_ENV === "production"
        ? {
            maxAge: 60 * 60 * 24 * 365,
            includeSubDomains: true,
            preload: true
          }
        : false
  })
);
if (env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    const forwardedProto = req.headers["x-forwarded-proto"];
    if (forwardedProto && forwardedProto !== "https") {
      if (req.method === "GET" || req.method === "HEAD") {
        const host = req.headers.host;
        const target = host ? `https://${host}${req.originalUrl}` : undefined;
        if (target) {
          return res.redirect(301, target);
        }
      }
      return res.status(403).json({ message: "HTTPS required" });
    }
    return next();
  });
}
app.use(express.json({ limit: "20mb" }));
const configuredOrigins = [env.WEB_ORIGIN, env.ADMIN_ORIGIN, ...(env.CORS_ALLOWED_ORIGINS?.split(",") ?? [])]
  .map((value) => value?.trim() ?? "")
  .filter((value): value is string => value.length > 0);
const allowedOrigins = Array.from(new Set(configuredOrigins));

function parseOriginPatterns(): RegExp[] {
  const raw = (env.CORS_ALLOWED_ORIGIN_PATTERNS ?? "").trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .map((pattern) => new RegExp(pattern));
}

const allowedOriginPatterns = parseOriginPatterns();

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    if (allowedOrigins.includes(origin)) {
      callback(null, origin);
      return;
    }
    if (allowedOriginPatterns.some((pattern) => pattern.test(origin))) {
      callback(null, origin);
      return;
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(morgan("dev"));
app.use(requestIdMiddleware);
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

app.use(updateLastActive);
app.use(routes);
app.use(notFound);
app.use(errorHandler);
