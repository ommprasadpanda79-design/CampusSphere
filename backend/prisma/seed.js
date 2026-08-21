import bcrypt from "bcryptjs";
import { PrismaClient, Role, AttendanceStatus, NoticeTarget } from "@prisma/client";

const prisma = new PrismaClient();

const departments = ["Computer Science", "Electronics", "Mechanical"];
const firstNames = [
  "Aarav", "Aditi", "Arjun", "Diya", "Ishaan", "Kavya", "Krish", "Meera", "Nikhil", "Priya",
  "Rahul", "Riya", "Rohan", "Saanvi", "Siddharth", "Sneha", "Tanvi", "Varun", "Vihaan", "Zoya",
];

async function upsertUser(user, passwordHash) {
  return prisma.user.upsert({
    where: { email: user.email },
    update: { name: user.name, role: user.role, department: user.department, passwordHash },
    create: { ...user, passwordHash },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash("Demo@123", 12);

  const admin = await upsertUser({
    id: "admin-01", name: "Ananya Rao", email: "admin@campussphere.edu",
    role: Role.ADMIN, department: "Administration",
  }, passwordHash);

  const faculty = await Promise.all(
    [
      ["Dr. Maya Iyer", "maya.iyer", "Computer Science"],
      ["Prof. Kabir Shah", "kabir.shah", "Computer Science"],
      ["Dr. Neha Menon", "neha.menon", "Mathematics"],
      ["Prof. Vivek Nair", "vivek.nair", "Electronics"],
      ["Dr. Tara Singh", "tara.singh", "Mechanical"],
    ].map(([name, email, department], index) => upsertUser({
      id: `faculty-${index + 1}`,
      name,
      email: `${email}@campussphere.edu`,
      role: Role.FACULTY,
      department,
    }, passwordHash)),
  );

  const students = await Promise.all(firstNames.map((name, index) => upsertUser({
    id: `student-${String(index + 1).padStart(2, "0")}`,
    name: `${name} ${["Sharma", "Patel", "Reddy", "Gupta"][index % 4]}`,
    email: `student${index + 1}@campussphere.edu`,
    role: Role.STUDENT,
    department: departments[index % departments.length],
  }, passwordHash)));

  const courseDefinitions = [
    { id: "course-cs301", code: "CS301", name: "Data Structures", scheduleDay: "Monday", startTime: "09:00", room: "C-204", facultyId: faculty[0].id },
    { id: "course-cs305", code: "CS305", name: "Database Systems", scheduleDay: "Wednesday", startTime: "11:00", room: "C-301", facultyId: faculty[1].id },
    { id: "course-ma201", code: "MA201", name: "Applied Statistics", scheduleDay: "Friday", startTime: "10:00", room: "A-112", facultyId: faculty[2].id },
  ];
  const courses = [];
  for (const course of courseDefinitions) {
    courses.push(await prisma.course.upsert({
      where: { code: course.code }, update: course, create: course,
    }));
  }

  await prisma.enrollment.createMany({
    data: students.flatMap((student) => courses.map((course) => ({
      id: `enrollment-${student.id}-${course.code.toLowerCase()}`,
      studentId: student.id,
      courseId: course.id,
    }))),
    skipDuplicates: true,
  });

  const semesterDates = Array.from({ length: 24 }, (_, index) => {
    const date = new Date(Date.UTC(2026, 0, 12 + index * 4));
    return date;
  });

  const attendanceRows = students.flatMap((student, studentIndex) =>
    courses.flatMap((course, courseIndex) => semesterDates.map((date, sessionIndex) => {
      const absenceRate = studentIndex % 5 === 0 ? 0.42 : studentIndex % 5 === 1 ? 0.25 : 0.08;
      const signal = ((sessionIndex * 17 + studentIndex * 11 + courseIndex * 7) % 100) / 100;
      const isoDate = date.toISOString().slice(0, 10);
      return {
        id: `attendance-${student.id}-${course.code.toLowerCase()}-${isoDate}`,
        studentId: student.id,
        courseId: course.id,
        date,
        status: signal < absenceRate ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT,
      };
    })),
  );
  await prisma.attendance.createMany({ data: attendanceRows, skipDuplicates: true });

  const exams = [
    ["Quiz 1", 20, new Date("2026-02-01T09:00:00Z")],
    ["Midterm", 50, new Date("2026-03-01T09:00:00Z")],
    ["Assignment", 25, new Date("2026-04-01T09:00:00Z")],
    ["Final", 100, new Date("2026-05-01T09:00:00Z")],
  ];
  for (const [studentIndex, student] of students.entries()) {
    for (const [courseIndex, course] of courses.entries()) {
      for (const [examIndex, [examType, maxScore, recordedAt]] of exams.entries()) {
        const base = 86 - (studentIndex % 5) * 6 + courseIndex * 2;
        const trend = studentIndex % 5 === 0 ? -9 * examIndex : studentIndex % 5 === 1 ? -3 * examIndex : 2 * examIndex;
        const percent = Math.max(32, Math.min(98, base + trend + ((studentIndex + courseIndex) % 5) - 2));
        const score = Math.round((percent / 100) * maxScore * 10) / 10;
        await prisma.mark.upsert({
          where: { studentId_courseId_examType: { studentId: student.id, courseId: course.id, examType } },
          update: { score, maxScore, recordedAt },
          create: {
            id: `mark-${student.id}-${course.code.toLowerCase()}-${examIndex + 1}`,
            studentId: student.id, courseId: course.id, examType, score, maxScore, recordedAt,
          },
        });
      }
    }
  }

  const noticeRows = [
    { id: "notice-welcome", title: "Welcome to CampusSphere", content: "The new academic portal is live. Review your timetable and profile details.", targetRole: NoticeTarget.ALL },
    { id: "notice-exams", title: "End-semester examination schedule", content: "The detailed examination timetable is now available through your department office.", targetRole: NoticeTarget.STUDENT },
    { id: "notice-faculty", title: "Attendance submission reminder", content: "Please finalize attendance records by Friday at 5 PM.", targetRole: NoticeTarget.FACULTY },
  ];
  for (const notice of noticeRows) {
    await prisma.notice.upsert({
      where: { id: notice.id }, update: { ...notice, postedById: admin.id },
      create: { ...notice, postedById: admin.id },
    });
  }

  console.log(`Seeded ${students.length} students, ${faculty.length} faculty, ${courses.length} courses, ${attendanceRows.length} attendance records and demo notices.`);
  console.log("Demo password for every seeded account: Demo@123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
