import { createLoggerWithContext } from "../pkg/logger";

export const logger = createLoggerWithContext("api");

export const logRequest = (
  method: string,
  path: string,
  status: number,
  durationMs: number,
) => {
  logger.info(`${method} ${path} ${status} - ${durationMs}ms`);
};
