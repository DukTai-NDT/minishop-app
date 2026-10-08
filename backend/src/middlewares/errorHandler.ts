import type { ErrorRequestHandler, RequestHandler } from "express";
import { AppError } from "../lib/errors.js";

export const notFound: RequestHandler = (_req, res) => {
  res
    .status(404)
    .json({ success: false, error: { code: "NOT_FOUND", message: "Route not found." } });
};

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, next) => {
  void next;
  if (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    error.type === "entity.parse.failed"
  ) {
    res.status(400).json({
      success: false,
      error: { code: "INVALID_JSON", message: "Request body must contain valid JSON." },
    });
    return;
  }
  if (error instanceof AppError) {
    res
      .status(error.status)
      .json({ success: false, error: { code: error.code, message: error.message } });
    return;
  }
  if (typeof error === "object" && error !== null && "code" in error && error.code === "P2034") {
    res.status(409).json({
      success: false,
      error: {
        code: "ORDER_CONFLICT",
        message: "Inventory changed during checkout. Please try again.",
      },
    });
    return;
  }
  console.error(error);
  res.status(500).json({
    success: false,
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." },
  });
};
