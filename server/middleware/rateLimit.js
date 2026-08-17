import rateLimit from "express-rate-limit";

// Limit repeated login requests
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: { error: "Too many login attempts, please try again after 15 minutes." },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Limit repeated OTP requests (more strict to prevent email/sms bombing)
export const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { error: "Too many OTP requests, please try again after 1 hour." },
  standardHeaders: true,
  legacyHeaders: false,
});
