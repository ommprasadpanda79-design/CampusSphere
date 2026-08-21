import { Router } from "express";
import { deleteAttendance, listAttendance, recordAttendance, updateAttendance } from "../controllers/attendanceController.js";
import { allowRoles } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { attendanceSchemas } from "../validators/schemas.js";

const router = Router();
router.get("/", validate(attendanceSchemas.list), asyncHandler(listAttendance));
router.post("/", allowRoles("FACULTY", "ADMIN"), validate(attendanceSchemas.recordBatch), asyncHandler(recordAttendance));
router.patch("/:id", allowRoles("FACULTY", "ADMIN"), validate(attendanceSchemas.update), asyncHandler(updateAttendance));
router.delete("/:id", allowRoles("FACULTY", "ADMIN"), validate(attendanceSchemas.id), asyncHandler(deleteAttendance));
export default router;

