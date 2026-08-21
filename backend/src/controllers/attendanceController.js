import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/AppError.js";
import { assertFacultyOwnsCourse } from "../services/accessService.js";

const include = {
  student: { select: { id: true, name: true, department: true } },
  course: { select: { id: true, code: true, name: true } },
};

export async function listAttendance(req, res) {
  const { courseId, studentId, date } = req.validated.query;
  let where = {
    ...(courseId ? { courseId } : {}),
    ...(studentId ? { studentId } : {}),
    ...(date ? { date: new Date(`${date}T00:00:00.000Z`) } : {}),
  };
  if (req.user.role === "STUDENT") where = { ...where, studentId: req.user.id };
  if (req.user.role === "FACULTY") {
    const owned = await prisma.course.findMany({ where: { facultyId: req.user.id }, select: { id: true } });
    where = { ...where, courseId: { in: owned.map((course) => course.id) } };
  }
  const attendance = await prisma.attendance.findMany({ where, include, orderBy: [{ date: "desc" }, { student: { name: "asc" } }] });
  res.json({ attendance });
}

export async function recordAttendance(req, res) {
  const { courseId, date, records } = req.validated.body;
  await assertFacultyOwnsCourse(req.user, courseId);
  const studentIds = [...new Set(records.map((record) => record.studentId))];
  const enrolledCount = await prisma.enrollment.count({ where: { courseId, studentId: { in: studentIds } } });
  if (enrolledCount !== studentIds.length) throw new AppError(400, "Every student must be enrolled in the selected course");
  const attendanceDate = new Date(`${date}T00:00:00.000Z`);
  const saved = await prisma.$transaction(records.map((record) => prisma.attendance.upsert({
    where: { studentId_courseId_date: { studentId: record.studentId, courseId, date: attendanceDate } },
    update: { status: record.status },
    create: { studentId: record.studentId, courseId, date: attendanceDate, status: record.status },
    include,
  })));
  res.status(201).json({ attendance: saved });
}

export async function updateAttendance(req, res) {
  const current = await prisma.attendance.findUnique({ where: { id: req.validated.params.id } });
  if (!current) throw new AppError(404, "Attendance record not found");
  await assertFacultyOwnsCourse(req.user, current.courseId);
  const data = { ...req.validated.body };
  if (data.date) data.date = new Date(`${data.date}T00:00:00.000Z`);
  const attendance = await prisma.attendance.update({ where: { id: current.id }, data, include });
  res.json({ attendance });
}

export async function deleteAttendance(req, res) {
  const current = await prisma.attendance.findUnique({ where: { id: req.validated.params.id } });
  if (!current) throw new AppError(404, "Attendance record not found");
  await assertFacultyOwnsCourse(req.user, current.courseId);
  await prisma.attendance.delete({ where: { id: current.id } });
  res.status(204).send();
}

