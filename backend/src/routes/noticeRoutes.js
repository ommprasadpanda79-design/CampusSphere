import { Router } from "express";
import { createNotice, deleteNotice, listNotices, updateNotice } from "../controllers/noticeController.js";
import { allowRoles } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { noticeSchemas } from "../validators/schemas.js";

const router = Router();
router.get("/", asyncHandler(listNotices));
router.post("/", allowRoles("ADMIN"), validate(noticeSchemas.create), asyncHandler(createNotice));
router.patch("/:id", allowRoles("ADMIN"), validate(noticeSchemas.update), asyncHandler(updateNotice));
router.delete("/:id", allowRoles("ADMIN"), validate(noticeSchemas.id), asyncHandler(deleteNotice));
export default router;

