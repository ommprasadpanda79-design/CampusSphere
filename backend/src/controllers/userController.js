import bcrypt from "bcryptjs";
import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/AppError.js";

const userSelect = { id: true, name: true, email: true, role: true, department: true, createdAt: true };

export async function listUsers(_req, res) {
  const users = await prisma.user.findMany({ select: userSelect, orderBy: [{ role: "asc" }, { name: "asc" }] });
  res.json({ users });
}

export async function createUser(req, res) {
  const { password, ...data } = req.validated.body;
  const user = await prisma.user.create({ data: { ...data, passwordHash: await bcrypt.hash(password, 12) }, select: userSelect });
  res.status(201).json({ user });
}

export async function updateUser(req, res) {
  const { id } = req.validated.params;
  const { password, ...changes } = req.validated.body;
  if (id === req.user.id && changes.role && changes.role !== "ADMIN") {
    throw new AppError(400, "You cannot remove your own admin access");
  }
  const data = { ...changes, ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}) };
  const user = await prisma.user.update({ where: { id }, data, select: userSelect });
  res.json({ user });
}

export async function deleteUser(req, res) {
  const { id } = req.validated.params;
  if (id === req.user.id) throw new AppError(400, "You cannot delete your own account");
  await prisma.user.delete({ where: { id } });
  res.status(204).send();
}

