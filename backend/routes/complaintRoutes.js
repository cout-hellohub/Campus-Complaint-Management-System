import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { upload } from '../utils/fileUploadService.js';
import {
  createComplaint,
  submitComplaint,
  getMyComplaints,
  getMyComplaintsStats,
  getPublicComplaints,
  getAssignedComplaints,
  getAssignedComplaintsStats,
  getComplaint,
  upvoteComplaint,
  getAllComplaints,
  updateComplaintStatus,
  deleteComplaint,
  forwardComplaint,
} from '../controllers/complaintController.js';

const router = express.Router();

// Protected routes - require authentication
router.post(
  '/create',
  protect,
  upload.array('attachments', 5),
  createComplaint
);

// Legacy endpoint for clients still posting to /api/complaints
router.post(
  '/',
  protect,
  upload.array('attachments', 5),
  submitComplaint
);

router.get('/all', protect, getAllComplaints); // All complaints for admin (must be before /:id)
router.get('/my-complaints/stats', protect, getMyComplaintsStats); // Stats for student dashboard
router.get('/my-complaints', protect, getMyComplaints);
router.get('/public', protect, getPublicComplaints); // Public complaints (still requires auth)
router.get('/assigned/stats', protect, getAssignedComplaintsStats); // Stats for committee dashboard
router.get('/assigned', protect, getAssignedComplaints); // Assigned complaints for committee
router.post('/:id/upvote', protect, upvoteComplaint); // Upvote a public complaint
router.patch('/:id/status', protect, updateComplaintStatus); // Update complaint status (admin/committee)
router.put('/:id/forward', protect, forwardComplaint); // Forward complaint to another committee (committee only)
router.delete('/:id', protect, deleteComplaint); // Delete complaint (students only)
router.get('/:id', protect, getComplaint);

export default router;

