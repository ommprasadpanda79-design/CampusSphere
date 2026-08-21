import { Router } from "express";
import { facultyDashboard, studentDashboard } from "../controllers/dashboardController.js";
import { allowRoles } from "../middleware/authorize.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.get("/student", allowRoles("STUDENT"), asyncHandler(studentDashboard));
router.get("/faculty/:courseId", allowRoles("FACULTY", "ADMIN"), asyncHandler(facultyDashboard));
export default router;

