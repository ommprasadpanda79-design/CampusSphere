import { Prisma } from "@prisma/client";
import { AppError } from "../utils/AppError.js";

export const notFound = (req, _res, next) => {
  next(new AppError(404, `Route ${req.method} ${req.originalUrl} was not found`));
};

export const errorHandler = (error, _req, res, _next) => {
  let normalized = error;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") normalized = new AppError(409, "A record with those values already exists");
    if (error.code === "P2025") normalized = new AppError(404, "Record not found");
    if (error.code === "P2003") normalized = new AppError(409, "This record is still referenced by other data");
  }

  const status = normalized.statusCode ?? 500;
  if (status >= 500) console.error(normalized);
  res.status(status).json({
    error: normalized.message ?? "Internal server error",
    ...(normalized.details ? { details: normalized.details } : {}),
  });
};

