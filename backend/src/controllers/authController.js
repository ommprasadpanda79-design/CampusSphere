import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/AppError.js";
import {
  createAccessToken, createRefreshToken, hashToken, publicUser, refreshCookieOptions,
} from "../services/tokenService.js";

async function issueSession(res, user) {
  const refreshToken = await createRefreshToken(user.id);
  res.cookie("campussphere_refresh", refreshToken, refreshCookieOptions);
  return { accessToken: createAccessToken(user), user: publicUser(user) };
}

export async function register(req, res) {
  const { name, email, password, department } = req.validated.body;
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) throw new AppError(409, "An account with this email already exists");
  const user = await prisma.user.create({
    data: { name, email, passwordHash: await bcrypt.hash(password, 12), department, role: "STUDENT" },
  });
  res.status(201).json(await issueSession(res, user));
}

export async function login(req, res) {
  const { email, password } = req.validated.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError(401, "Invalid email or password");
  }
  await prisma.refreshToken.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  res.json(await issueSession(res, user));
}

export async function refresh(req, res) {
  const currentToken = req.cookies.campussphere_refresh;
  if (!currentToken) throw new AppError(401, "Refresh session is missing");

  let payload;
  try {
    payload = jwt.verify(currentToken, env.JWT_REFRESH_SECRET);
  } catch {
    res.clearCookie("campussphere_refresh", refreshCookieOptions);
    throw new AppError(401, "Refresh session is invalid or expired");
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(currentToken) }, include: { user: true },
  });
  if (!stored || stored.expiresAt < new Date() || stored.userId !== payload.sub) {
    res.clearCookie("campussphere_refresh", refreshCookieOptions);
    throw new AppError(401, "Refresh session is no longer valid");
  }

  await prisma.refreshToken.delete({ where: { id: stored.id } });
  res.json(await issueSession(res, stored.user));
}

export async function logout(req, res) {
  const token = req.cookies.campussphere_refresh;
  if (token) await prisma.refreshToken.deleteMany({ where: { tokenHash: hashToken(token) } });
  res.clearCookie("campussphere_refresh", refreshCookieOptions);
  res.status(204).send();
}

