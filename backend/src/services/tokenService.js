import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../prisma/client.js";

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const publicUser = ({ id, name, email, role, department }) => ({ id, name, email, role, department });

export function createAccessToken(user) {
  return jwt.sign({ role: user.role }, env.JWT_SECRET, { subject: user.id, expiresIn: "15m" });
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createRefreshToken(userId) {
  const token = jwt.sign(
    { tokenId: crypto.randomUUID() },
    env.JWT_REFRESH_SECRET,
    { subject: userId, expiresIn: "7d" },
  );
  await prisma.refreshToken.create({
    data: { tokenHash: hashToken(token), userId, expiresAt: new Date(Date.now() + REFRESH_TTL_MS) },
  });
  return token;
}

export const refreshCookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE ? env.COOKIE_SECURE === "true" : env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/auth",
  maxAge: REFRESH_TTL_MS,
};
