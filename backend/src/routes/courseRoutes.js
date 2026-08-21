import { Router } from "express";
import { listCourses } from "../controllers/courseController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.get("/", asyncHandler(listCourses));
export default router;

