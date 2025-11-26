import express from "express";
import { generateMonthlyCommitteeReport, generateMonthlyAdminReport } from "../controllers/reportController.js";
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get("/committee-monthly", protect, generateMonthlyCommitteeReport);
router.get("/admin-monthly", protect, generateMonthlyAdminReport);

export default router;
