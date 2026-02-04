import { app } from "./app";
import { env } from "./config/env";
import { registerPrismaShutdown } from "./db/prisma";
import { getDatabaseInfo } from "./utils/dbInfo";
import { logger } from "./utils/logger";

registerPrismaShutdown();

const port = env.PORT;

app.listen(port, () => {
  const dbInfo = getDatabaseInfo(env.DATABASE_URL);
  logger.info(`API running on http://localhost:${port}`);
  logger.info(`Database connected: ${dbInfo.database} on ${dbInfo.host}`);
});
