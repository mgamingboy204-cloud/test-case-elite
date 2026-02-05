import express from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { sessionCookieName, sessionCookieOptions } from "./config/auth";
import { env } from "./config/env";
import { updateLastActive } from "./middlewares/activity";
import { errorHandler } from "./middlewares/errorHandler";
import { notFound } from "./middlewares/notFound";
import routes from "./routes";
import { ensureUploadsDir } from "./services/photoService";

const PgStore = connectPg(session);

export const app = express();

if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

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
app.use(express.json({ limit: "7mb" }));
const allowedOrigins = [env.WEB_ORIGIN, env.ADMIN_ORIGIN].filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(morgan("dev"));
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

app.use(
  session({
    name: sessionCookieName,
    store: new PgStore({
      conString: env.DATABASE_URL,
      tableName: "session",
      createTableIfMissing: true
    }),
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: sessionCookieOptions
  })
);

app.use(updateLastActive);
app.use(routes);
app.use(notFound);
app.use(errorHandler);
