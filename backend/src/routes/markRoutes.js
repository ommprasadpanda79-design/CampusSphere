import { Router } from "express";
import { createMark, deleteMark, listMarks, updateMark } from "../controllers/markController.js";
import { allowRoles } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { markSchemas } from "../validators/schemas.js";

const router = Router();
router.get("/", validate(markSchemas.list), asyncHandler(listMarks));
router.post("/", allowRoles("FACULTY", "ADMIN"), validate(markSchemas.create), asyncHandler(createMark));
router.patch("/:id", allowRoles("FACULTY", "ADMIN"), validate(markSchemas.update), asyncHandler(updateMark));
router.delete("/:id", allowRoles("FACULTY", "ADMIN"), validate(markSchemas.id), asyncHandler(deleteMark));
export default router;

