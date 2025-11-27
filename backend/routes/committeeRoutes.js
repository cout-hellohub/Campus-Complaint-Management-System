import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { getCommittees } from '../controllers/complaintController.js';

const router = express.Router();

// Get all available committees
router.get('/', protect, getCommittees);

export default router;

