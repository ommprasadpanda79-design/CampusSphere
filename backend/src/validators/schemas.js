import { z } from "zod";

const idParams = z.object({ id: z.string().min(1) });
const studentIdParams = z.object({ studentId: z.string().min(1) });
const courseIdParams = z.object({ courseId: z.string().min(1) });
const email = z.string().trim().email().transform((value) => value.toLowerCase());
const password = z.string().min(8).max(72);
const role = z.enum(["STUDENT", "FACULTY", "ADMIN"]);
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format");

export const authSchemas = {
  register: z.object({ body: z.object({
    name: z.string().trim().min(2).max(100), email, password,
    department: z.string().trim().min(2).max(100),
  }), params: z.object({}), query: z.object({}) }),
  login: z.object({ body: z.object({ email, password: z.string().min(1) }), params: z.object({}), query: z.object({}) }),
};

export const userSchemas = {
  create: z.object({ body: z.object({
    name: z.string().trim().min(2).max(100), email, password, role,
    department: z.string().trim().min(2).max(100),
  }), params: z.object({}), query: z.object({}) }),
  update: z.object({ body: z.object({
    name: z.string().trim().min(2).max(100).optional(), email: email.optional(),
    password: password.optional(), role: role.optional(), department: z.string().trim().min(2).max(100).optional(),
  }).refine((body) => Object.keys(body).length > 0, "At least one field is required"), params: idParams, query: z.object({}) }),
  id: z.object({ body: z.object({}), params: idParams, query: z.object({}) }),
};

export const attendanceSchemas = {
  list: z.object({ body: z.object({}), params: z.object({}), query: z.object({
    courseId: z.string().min(1).optional(), studentId: z.string().min(1).optional(), date: dateString.optional(),
  }) }),
  recordBatch: z.object({ body: z.object({
    courseId: z.string().min(1), date: dateString,
    records: z.array(z.object({ studentId: z.string().min(1), status: z.enum(["PRESENT", "ABSENT"]) })).min(1).max(200),
  }), params: z.object({}), query: z.object({}) }),
  update: z.object({ body: z.object({ status: z.enum(["PRESENT", "ABSENT"]).optional(), date: dateString.optional() })
    .refine((body) => Object.keys(body).length > 0, "At least one field is required"), params: idParams, query: z.object({}) }),
  id: z.object({ body: z.object({}), params: idParams, query: z.object({}) }),
};

const markBody = z.object({
  studentId: z.string().min(1), courseId: z.string().min(1), examType: z.string().trim().min(2).max(50),
  score: z.number().min(0), maxScore: z.number().positive(),
}).refine((body) => body.score <= body.maxScore, { message: "Score cannot exceed max score", path: ["score"] });

export const markSchemas = {
  list: z.object({ body: z.object({}), params: z.object({}), query: z.object({
    courseId: z.string().min(1).optional(), studentId: z.string().min(1).optional(),
  }) }),
  create: z.object({ body: markBody, params: z.object({}), query: z.object({}) }),
  update: z.object({ body: z.object({
    examType: z.string().trim().min(2).max(50).optional(), score: z.number().min(0).optional(), maxScore: z.number().positive().optional(),
  }).refine((body) => Object.keys(body).length > 0, "At least one field is required"), params: idParams, query: z.object({}) }),
  id: z.object({ body: z.object({}), params: idParams, query: z.object({}) }),
};

export const noticeSchemas = {
  create: z.object({ body: z.object({
    title: z.string().trim().min(3).max(150), content: z.string().trim().min(5).max(5000),
    targetRole: z.enum(["ALL", "STUDENT", "FACULTY", "ADMIN"]).default("ALL"),
  }), params: z.object({}), query: z.object({}) }),
  update: z.object({ body: z.object({
    title: z.string().trim().min(3).max(150).optional(), content: z.string().trim().min(5).max(5000).optional(),
    targetRole: z.enum(["ALL", "STUDENT", "FACULTY", "ADMIN"]).optional(),
  }).refine((body) => Object.keys(body).length > 0, "At least one field is required"), params: idParams, query: z.object({}) }),
  id: z.object({ body: z.object({}), params: idParams, query: z.object({}) }),
};

export const insightSchemas = {
  student: z.object({ body: z.object({}), params: studentIdParams, query: z.object({ courseId: z.string().min(1).optional() }) }),
  course: z.object({ body: z.object({}), params: courseIdParams, query: z.object({}) }),
};

