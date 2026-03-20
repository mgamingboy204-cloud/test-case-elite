import { app } from "./app";
import { env } from "./config/env";
import { registerPrismaShutdown } from "./db/prisma";
import { getDatabaseInfo } from "./utils/dbInfo";
import { logger } from "./utils/logger";

registerPrismaShutdown();

const port = Number(process.env.PORT) || Number(env.PORT) || 10000;
const buildTimestamp = process.env.BUILD_TIMESTAMP ?? new Date().toISOString();
const commitSha = process.env.RENDER_GIT_COMMIT ?? process.env.GIT_COMMIT ?? "unknown";
const versionMarker = "api-live-updates-v1";

const server = app.listen(port, "0.0.0.0", () => {
  const dbInfo = getDatabaseInfo(env.DATABASE_URL);
  logger.info(`API running on port ${port}`);
  logger.info(`Database connected: ${dbInfo.database} on ${dbInfo.host}`);
  logger.info("startup.version", { versionMarker, commitSha, buildTimestamp });
});

server.requestTimeout = 0;
server.setTimeout(0);
