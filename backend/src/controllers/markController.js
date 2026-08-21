import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/AppError.js";
import { assertEnrolled, assertFacultyOwnsCourse } from "../services/accessService.js";

const include = {
  student: { select: { id: true, name: true, department: true } },
  course: { select: { id: true, code: true, name: true } },
};

export async function listMarks(req, res) {
  const { courseId, studentId } = req.validated.query;
  let where = { ...(courseId ? { courseId } : {}), ...(studentId ? { studentId } : {}) };
  if (req.user.role === "STUDENT") where = { ...where, studentId: req.user.id };
  if (req.user.role === "FACULTY") {
    const owned = await prisma.course.findMany({ where: { facultyId: req.user.id }, select: { id: true } });
    where = { ...where, courseId: { in: owned.map((course) => course.id) } };
  }
  const marks = await prisma.mark.findMany({ where, include, orderBy: [{ recordedAt: "desc" }, { student: { name: "asc" } }] });
  res.json({ marks });
}

export async function createMark(req, res) {
  const data = req.validated.body;
  await assertFacultyOwnsCourse(req.user, data.courseId);
  await assertEnrolled(data.studentId, data.courseId);
  const mark = await prisma.mark.upsert({
    where: { studentId_courseId_examType: { studentId: data.studentId, courseId: data.courseId, examType: data.examType } },
    update: { score: data.score, maxScore: data.maxScore }, create: data, include,
  });
  res.status(201).json({ mark });
}

export async function updateMark(req, res) {
  const current = await prisma.mark.findUnique({ where: { id: req.validated.params.id } });
  if (!current) throw new AppError(404, "Mark not found");
  await assertFacultyOwnsCourse(req.user, current.courseId);
  const nextScore = req.validated.body.score ?? current.score;
  const nextMax = req.validated.body.maxScore ?? current.maxScore;
  if (nextScore > nextMax) throw new AppError(400, "Score cannot exceed max score");
  const mark = await prisma.mark.update({ where: { id: current.id }, data: req.validated.body, include });
  res.json({ mark });
}

export async function deleteMark(req, res) {
  const current = await prisma.mark.findUnique({ where: { id: req.validated.params.id } });
  if (!current) throw new AppError(404, "Mark not found");
  await assertFacultyOwnsCourse(req.user, current.courseId);
  await prisma.mark.delete({ where: { id: current.id } });
  res.status(204).send();
}

