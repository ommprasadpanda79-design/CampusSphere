import { Router } from "express";
import { login, logout, refresh, register } from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authSchemas } from "../validators/schemas.js";

const router = Router();
router.post("/register", validate(authSchemas.register), asyncHandler(register));
router.post("/login", validate(authSchemas.login), asyncHandler(login));
router.post("/refresh", asyncHandler(refresh));
router.post("/logout", asyncHandler(logout));
export default router;

