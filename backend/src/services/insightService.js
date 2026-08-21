import { prisma } from "../prisma/client.js";
import { predictRisk } from "./aiService.js";
import { AppError } from "../utils/AppError.js";

export async function getStudentMetrics(studentId, courseId) {
  const student = await prisma.user.findFirst({
    where: { id: studentId, role: "STUDENT" },
    select: { id: true, name: true, department: true },
  });
  if (!student) throw new AppError(404, "Student not found");

  const courseFilter = courseId ? { courseId } : {};
  const [attendance, marks] = await Promise.all([
    prisma.attendance.findMany({ where: { studentId, ...courseFilter }, select: { status: true } }),
    prisma.mark.findMany({
      where: { studentId, ...courseFilter },
      select: { examType: true, score: true, maxScore: true, recordedAt: true },
      orderBy: { recordedAt: "asc" },
    }),
  ]);

  const present = attendance.filter((entry) => entry.status === "PRESENT").length;
  const attendancePercentage = attendance.length ? (present / attendance.length) * 100 : 100;
  const marksTrend = marks.map((mark) => Math.round((mark.score / mark.maxScore) * 1000) / 10);
  const assignments = marks.filter((mark) => mark.examType.toLowerCase().includes("assignment"));
  const assignmentEngagementScore = assignments.length
    ? assignments.reduce((sum, mark) => sum + (mark.score / mark.maxScore) * 100, 0) / assignments.length
    : marksTrend.at(-1) ?? 75;

  return {
    student,
    attendancePercentage: Math.round(attendancePercentage * 10) / 10,
    marksTrend,
    assignmentEngagementScore: Math.round(assignmentEngagementScore * 10) / 10,
  };
}

export async function buildStudentInsight(studentId, courseId) {
  const metrics = await getStudentMetrics(studentId, courseId);
  const risk = await predictRisk({
    attendance_percentage: metrics.attendancePercentage,
    marks_trend: metrics.marksTrend,
    assignment_engagement_score: metrics.assignmentEngagementScore,
  });
  return { ...metrics.student, metrics: {
    attendance_percentage: metrics.attendancePercentage,
    marks_trend: metrics.marksTrend,
    assignment_engagement_score: metrics.assignmentEngagementScore,
  }, ...risk };
}
