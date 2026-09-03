import express from "express";
import { requireAdmin, optionalAdmin } from "../middleware/auth.js";
import { getServices, getService, createService, updateService, deleteService } from "../controllers/serviceController.js";

const router = express.Router();

router.get("/", optionalAdmin, getServices);
router.get("/:id", optionalAdmin, getService);
router.post("/", requireAdmin, createService);
router.put("/:id", requireAdmin, updateService);
router.delete("/:id", requireAdmin, deleteService);

export default router;
