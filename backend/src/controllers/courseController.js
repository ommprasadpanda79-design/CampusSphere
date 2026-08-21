import { prisma } from "../prisma/client.js";

const include = { faculty: { select: { id: true, name: true } }, _count: { select: { enrollments: true } } };

export async function listCourses(req, res) {
  let where = {};
  if (req.user.role === "STUDENT") where = { enrollments: { some: { studentId: req.user.id } } };
  if (req.user.role === "FACULTY") where = { facultyId: req.user.id };
  const courses = await prisma.course.findMany({ where, include, orderBy: { code: "asc" } });
  res.json({ courses });
}
