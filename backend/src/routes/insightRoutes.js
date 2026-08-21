import { Router } from "express";
import { collegeInsights, courseInsights, studentInsight } from "../controllers/insightController.js";
import { allowRoles } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { insightSchemas } from "../validators/schemas.js";

const router = Router();
router.get("/college", allowRoles("ADMIN"), asyncHandler(collegeInsights));
router.get("/course/:courseId", allowRoles("FACULTY", "ADMIN"), validate(insightSchemas.course), asyncHandler(courseInsights));
router.get("/:studentId", validate(insightSchemas.student), asyncHandler(studentInsight));
export default router;

