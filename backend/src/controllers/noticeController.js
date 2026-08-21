import { prisma } from "../prisma/client.js";

const include = { postedBy: { select: { id: true, name: true } } };

export async function listNotices(req, res) {
  const where = req.user.role === "ADMIN" ? {} : { targetRole: { in: ["ALL", req.user.role] } };
  const notices = await prisma.notice.findMany({ where, include, orderBy: { createdAt: "desc" } });
  res.json({ notices });
}

export async function createNotice(req, res) {
  const notice = await prisma.notice.create({ data: { ...req.validated.body, postedById: req.user.id }, include });
  res.status(201).json({ notice });
}

export async function updateNotice(req, res) {
  const notice = await prisma.notice.update({ where: { id: req.validated.params.id }, data: req.validated.body, include });
  res.json({ notice });
}

export async function deleteNotice(req, res) {
  await prisma.notice.delete({ where: { id: req.validated.params.id } });
  res.status(204).send();
}

