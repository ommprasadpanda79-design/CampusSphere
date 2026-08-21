import { prisma } from "../prisma/client.js";
import { assertFacultyOwnsCourse } from "../services/accessService.js";
import { buildStudentInsight } from "../services/insightService.js";
import { AppError } from "../utils/AppError.js";

export async function studentDashboard(req, res) {
  const [enrollments, attendance, marks, notices, insight] = await Promise.all([
    prisma.enrollment.findMany({
      where: { studentId: req.user.id },
      select: { course: { include: { faculty: { select: { name: true } } } } },
    }),
    prisma.attendance.findMany({ where: { studentId: req.user.id }, select: { courseId: true, status: true } }),
    prisma.mark.findMany({
      where: { studentId: req.user.id }, include: { course: { select: { code: true, name: true } } }, orderBy: { recordedAt: "desc" },
    }),
    prisma.notice.findMany({
      where: { targetRole: { in: ["ALL", "STUDENT"] } }, include: { postedBy: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 8,
    }),
    buildStudentInsight(req.user.id),
  ]);

  const attendanceByCourse = enrollments.map(({ course }) => {
    const records = attendance.filter((entry) => entry.courseId === course.id);
    const present = records.filter((entry) => entry.status === "PRESENT").length;
    return { courseId: course.id, code: course.code, name: course.name, percentage: records.length ? Math.round((present / records.length) * 1000) / 10 : 100 };
  });
  const timetable = enrollments.map(({ course }) => ({
    id: course.id, code: course.code, name: course.name, day: course.scheduleDay,
    time: course.startTime, room: course.room, faculty: course.faculty.name,
  }));
  res.json({ attendance: attendanceByCourse, marks, notices, timetable, insight });
}

export async function facultyDashboard(req, res) {
  const { courseId } = req.params;
  await assertFacultyOwnsCourse(req.user, courseId);
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      enrollments: { include: { student: { select: { id: true, name: true, email: true, department: true } } } },
      marks: true,
      attendance: { orderBy: { date: "desc" } },
    },
  });
  if (!course) throw new AppError(404, "Course not found");
  const insights = await Promise.all(course.enrollments.map(({ studentId }) => buildStudentInsight(studentId, courseId)));
  const students = course.enrollments.map(({ student }) => ({
    ...student,
    marks: course.marks.filter((mark) => mark.studentId === student.id),
    latestAttendance: course.attendance.find((entry) => entry.studentId === student.id)?.status ?? "PRESENT",
    insight: insights.find((entry) => entry.id === student.id),
  }));
  res.json({ course: { id: course.id, code: course.code, name: course.name }, students });
}
