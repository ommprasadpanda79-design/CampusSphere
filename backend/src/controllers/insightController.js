import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/AppError.js";
import { assertFacultyOwnsCourse } from "../services/accessService.js";
import { buildStudentInsight } from "../services/insightService.js";

async function assertCanViewStudent(user, studentId) {
  if (user.role === "ADMIN" || (user.role === "STUDENT" && user.id === studentId)) return;
  if (user.role === "FACULTY") {
    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId, course: { facultyId: user.id } }, select: { id: true },
    });
    if (enrollment) return;
  }
  throw new AppError(403, "You cannot view insights for this student");
}

export async function studentInsight(req, res) {
  const { studentId } = req.validated.params;
  const { courseId } = req.validated.query;
  await assertCanViewStudent(req.user, studentId);
  if (courseId && req.user.role === "FACULTY") await assertFacultyOwnsCourse(req.user, courseId);
  res.json({ insight: await buildStudentInsight(studentId, courseId) });
}

export async function courseInsights(req, res) {
  const { courseId } = req.validated.params;
  await assertFacultyOwnsCourse(req.user, courseId);
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, code: true, name: true, enrollments: { select: { studentId: true } } },
  });
  if (!course) throw new AppError(404, "Course not found");
  const insights = await Promise.all(course.enrollments.map(({ studentId }) => buildStudentInsight(studentId, courseId)));
  res.json({ course: { id: course.id, code: course.code, name: course.name }, insights });
}

export async function collegeInsights(_req, res) {
  const students = await prisma.user.findMany({ where: { role: "STUDENT" }, select: { id: true } });
  const insights = await Promise.all(students.map(({ id }) => buildStudentInsight(id)));
  const grouped = new Map();
  for (const insight of insights) {
    const current = grouped.get(insight.department) ?? { department: insight.department, students: 0, high: 0, medium: 0, low: 0, riskTotal: 0 };
    current.students += 1;
    current[insight.risk_label.toLowerCase()] += 1;
    current.riskTotal += insight.risk_score;
    grouped.set(insight.department, current);
  }
  const departments = [...grouped.values()].map(({ riskTotal, ...group }) => ({
    ...group, averageRisk: Math.round((riskTotal / group.students) * 10) / 10,
  }));
  res.json({ departments, insights });
}

