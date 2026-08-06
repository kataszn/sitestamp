import rateLimit from "express-rate-limit";


export const reportGenerationLimiter = rateLimit({
  windowMs: 60_000 * 5, // 5 minutes
  max: 10,           // max 10 report generations per 5-minute window per IP
  message: {
    status: 429,
    code: "TOO_MANY_REQUESTS",
    message: "Report generation is rate-limited. Please wait a moment and try again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});