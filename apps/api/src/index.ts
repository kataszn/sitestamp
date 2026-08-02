import { createServer } from "#/server";
import { ENV } from "#core/env";
import { logger } from "#core/logger";

process.on("unhandledRejection", (reason) => {
  throw reason;
});
process.on("uncaughtException", (err) => {
  logger.fatal("Uncaught exception", { err });
  process.exit(1);
});

createServer()
  .then((app) => {
    app.listen(ENV.PORT);
    logger.info("Server started", { port: ENV.PORT });
  })
  .catch((err) => {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.fatal("Application failed to start:", { err: error });
    process.exit(1);
  });
