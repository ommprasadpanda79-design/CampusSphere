import { Router } from "express";
import { createUser, deleteUser, listUsers, updateUser } from "../controllers/userController.js";
import { allowRoles } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { userSchemas } from "../validators/schemas.js";

const router = Router();
router.use(allowRoles("ADMIN"));
router.get("/", asyncHandler(listUsers));
router.post("/", validate(userSchemas.create), asyncHandler(createUser));
router.patch("/:id", validate(userSchemas.update), asyncHandler(updateUser));
router.delete("/:id", validate(userSchemas.id), asyncHandler(deleteUser));
export default router;

