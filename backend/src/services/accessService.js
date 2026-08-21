import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/AppError.js";

export async function assertFacultyOwnsCourse(user, courseId) {
  if (user.role === "ADMIN") return;
  const course = await prisma.course.findFirst({ where: { id: courseId, facultyId: user.id }, select: { id: true } });
  if (!course) throw new AppError(403, "You can only modify data for your own courses");
}

export async function assertEnrolled(studentId, courseId) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } }, select: { id: true },
  });
  if (!enrollment) throw new AppError(400, "The student is not enrolled in this course");
}

