import { app } from "./app";
import { env } from "./config/env";
import { registerPrismaShutdown } from "./db/prisma";
import { getDatabaseInfo } from "./utils/dbInfo";
import { logger } from "./utils/logger";

registerPrismaShutdown();

const port = Number(process.env.PORT) || Number(env.PORT) || 10000;

app.listen(port, "0.0.0.0", () => {
  const dbInfo = getDatabaseInfo(env.DATABASE_URL);
  logger.info(`API running on port ${port}`);
  logger.info(`Database connected: ${dbInfo.database} on ${dbInfo.host}`);
});
