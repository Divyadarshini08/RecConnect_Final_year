import { logMetric } from "./metrics.logger.js";

const responseTimeLogger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    // fire-and-forget logging (no await)
    logMetric("response_time", duration)
      .catch(err => console.error("Metric log failed:", err));
  });

  next();
};

export default responseTimeLogger;
