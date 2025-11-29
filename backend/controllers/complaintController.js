import Complaint from '../models/Complaint.js';
import Notification from '../models/Notification.js';
import { classifyComplaint, classifySubcategory } from '../utils/aiRouting.js';
import User from '../models/userModel.js';
import { sendStatusUpdateEmail } from '../utils/emailService.js';
import { deleteFromCloudinary } from '../utils/fileUploadService.js';

/**
 * Normalize category name to canonical form.
 * Maps all Internal Complaints Committee variations to "Internal Complaints Committee".
 */
export function normalizeCategory(category) {
  if (!category) return category;
  
  const normalized = String(category).trim();
  const lower = normalized.toLowerCase();
  
  // Map all ICC variations to canonical "Internal Complaints Committee"
  const iccVariants = [
    'internal complaints',
    'internal complaints committee',
    'internal complaint committee',
  ];
  
  if (iccVariants.includes(lower)) {
    return 'Internal Complaints Committee';
  }
  
  return normalized;
}

const COMMITTEE_CATEGORY_MAP = {
  Hostels: 'Hostel Management',
  Hostel: 'Hostel Management',
  Maintenance: 'Hostel Management',
  Canteen: 'Cafeteria',
  Cafeteria: 'Cafeteria',
  'Tech Committee': 'Tech-Support',
  Tech: 'Tech-Support',
  'Tech Support': 'Tech-Support',
  Sports: 'Sports',
  'Disciplinary Action': 'Internal Complaints Committee',
  'Internal Complaints': 'Internal Complaints Committee',
  'Internal Complaints Committee': 'Internal Complaints Committee',
  Academic: 'Academic',
  'Annual Fest': 'Annual Fest',
  Cultural: 'Cultural',
  Placement: 'Student Placement',
  'Student Placement': 'Student Placement',
  // Admin / General routing
  Admin: 'Admin',
  General: 'Admin',
  'General Complaints': 'Admin',
};

export const resolveCommitteeCategory = (committeeType) => {
  const mapped = COMMITTEE_CATEGORY_MAP[committeeType] || committeeType;
  return normalizeCategory(mapped);
};

/**
 * Create a new complaint
 * POST /api/complaints/create
 */
export const createComplaint = async (req, res) => {
  try {
    const { title, description, type, isAnonymous } = req.body;
    const userId = req.user._id; // From auth middleware

    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({
        message: 'Title and description are required',
      });
    }

    // Call AI routing to classify and prioritize
    let aiResult;
    try {
      aiResult = await classifyComplaint(title, description);
    } catch (error) {
      if (error?.code === 'INVALID_COMPLAINT') {
        return res.status(400).json({
          message: error.message || 'Complaint could not be processed. Please revise and try again.',
        });
      }

      console.error('AI Routing Error:', {
        message: error?.message || error?.toString(),
        code: error?.code,
        stack: error?.stack,
      });
      // Use fallback classification instead of crashing
      aiResult = {
        committee: 'Academic',
        priority: 'Medium',
      };
    }

    // Cloudinary provides the asset URL on the path property; secure_url is a fallback.
    const attachments = (req.files || [])
      .map((file) => file.path || file.secure_url)
      .filter(Boolean);

    // Normalize category to canonical form (especially for ICC variations)
    const normalizedCategory = normalizeCategory(aiResult.committee);
    
    // Create complaint in database
    const complaint = await Complaint.create({
      userId,
      title: title.trim(),
      description: description.trim(),
      category: normalizedCategory,
      priority: aiResult.priority,
      type: type === 'Personal' ? 'personal' : 'general',
      attachments,
      status: 'pending',
      isAnonymous: isAnonymous === "true",
    });

    // Create notifications for committee members responsible for this category
    (async () => {
      try {
        // Find all committee users and filter by resolved category match
        const committeeUsers = await User.find({ role: 'committee' }).select('_id committeeType name email');
        const normalizedComplaintCategory = normalizeCategory(complaint.category);
        const recipients = committeeUsers.filter((u) => {
          const userCategory = resolveCommitteeCategory(u.committeeType);
          return normalizeCategory(userCategory) === normalizedComplaintCategory;
        });

        if (recipients.length > 0) {
          const notifPromises = recipients.map((r) => {
            const message = `New complaint assigned to your committee: "${complaint.title}"`;
            return Notification.create({
              user: r._id,
              complaint: complaint._id,
              type: 'general',
              message,
              data: { assignedCategory: complaint.category, complaintId: complaint._id, assignedTo: r._id },
            });
          });

          await Promise.all(notifPromises);
        }
      } catch (notifyErr) {
        console.error('Failed to create committee notifications:', notifyErr);
      }
    })().catch(err => {
      // ✅ Catch any unhandled errors from the async IIFE
      console.error('Notification IIFE error:', err);
    });

    // Return success response with committee information
    res.status(201).json({
      message: 'Complaint submitted successfully',
      complaint: {
        _id: complaint._id,
        title: complaint.title,
        category: complaint.category,
        priority: complaint.priority,
        status: complaint.status,
        createdAt: complaint.createdAt,
      },
      routing: {
        committee: complaint.category,
        priority: complaint.priority,
      },
    });
  } catch (error) {
    console.error('Create Complaint Error:', {
      message: error?.message || error?.toString(),
      stack: error?.stack,
      name: error?.name,
    });
    res.status(500).json({
      message: 'Internal server error while creating complaint',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
    });
  }
};

// Backward compatibility: reuse the same implementation under the old name used by legacy routes.
export const submitComplaint = createComplaint;

/**
 * Get complaint statistics for the logged-in student
 * GET /api/complaints/my-complaints/stats
 */
export const getMyComplaintsStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get counts by status
    const [total, pending, inProgress, resolved, rejected] = await Promise.all([
      Complaint.countDocuments({ userId }),
      Complaint.countDocuments({ userId, status: 'pending' }),
      Complaint.countDocuments({ userId, status: 'in-progress' }),
      Complaint.countDocuments({ userId, status: 'resolved' }),
      Complaint.countDocuments({ userId, status: 'rejected' }),
    ]);

    res.status(200).json({
      total,
      pending,
      inProgress,
      resolved,
      rejected,
    });
  } catch (error) {
    console.error('Get My Complaints Stats Error:', error);
    res.status(500).json({
      message: error.message || 'Failed to fetch complaint statistics',
    });
  }
};

/**
 * Get all complaints for the logged-in user
 * GET /api/complaints/my-complaints
 */
export const getMyComplaints = async (req, res) => {
  try {
    const userId = req.user._id;
    const complaints = await Complaint.find({ userId })
      .sort({ createdAt: -1 })
      .select('-__v');

    res.status(200).json({
      complaints,
    });
  } catch (error) {
    console.error('Get My Complaints Error:', error);
    res.status(500).json({
      message: error.message || 'Failed to fetch complaints',
    });
  }
};

/**
 * Helper function to update priority based on upvote count
 */
const updatePriorityBasedOnUpvotes = async (complaint) => {
  const upvoteCount = complaint.upvotes?.length || 0;
  let newPriority = complaint.priority;

  // Priority thresholds based on upvotes
  // High: 10+ upvotes
  // Medium: 5-9 upvotes
  // Low: 0-4 upvotes
  if (upvoteCount >= 10) {
    newPriority = 'High';
  } else if (upvoteCount >= 5) {
    newPriority = 'Medium';
  } else {
    newPriority = 'Low';
  }

  // Only update if priority changed
  if (newPriority !== complaint.priority) {
    complaint.priority = newPriority;
    await complaint.save();
  }

  return newPriority;
};

/**
 * Get all public complaints (visible to everyone)
 * GET /api/complaints/public
 */
export const getPublicComplaints = async (req, res) => {
  try {
    const userId = req.user?._id; // Get current user ID if authenticated
    
    // Get all complaints where type is 'general' (public)
    // We'll sort by upvote count after fetching
    const complaints = await Complaint.find({ type: 'general' })
      .populate('userId', 'name email')
      .select('-__v -description'); // Don't expose full description in list view
    
    // Sort by upvote count (descending), then by creation date
    complaints.sort((a, b) => {
      const aUpvotes = a.upvotes?.length || 0;
      const bUpvotes = b.upvotes?.length || 0;
      if (bUpvotes !== aUpvotes) {
        return bUpvotes - aUpvotes; // Most upvoted first
      }
      return new Date(b.createdAt) - new Date(a.createdAt); // Newest first if same upvotes
    });

    // Format complaints to hide user identity if anonymous
    const formattedComplaints = complaints.map((complaint) => {
      const complaintObj = complaint.toObject();
      
      // If anonymous, hide user details
      if (complaint.isAnonymous) {
        complaintObj.userId = {
          name: 'Anonymous',
          email: null,
        };
      }
      
      // Add upvote count and whether current user has upvoted
      complaintObj.upvoteCount = complaint.upvotes?.length || 0;
      complaintObj.hasUpvoted = userId 
        ? complaint.upvotes?.some((id) => id.toString() === userId.toString()) 
        : false;
      
      return complaintObj;
    });

    res.status(200).json({
      complaints: formattedComplaints,
    });
  } catch (error) {
    console.error('Get Public Complaints Error:', error);
    res.status(500).json({
      message: error.message || 'Failed to fetch public complaints',
    });
  }
};

/**
 * Get complaint statistics for the logged-in committee
 * GET /api/complaints/assigned/stats
 */
export const getAssignedComplaintsStats = async (req, res) => {
  try {
    const user = req.user;
    
    // Check if user is a committee member
    if (user.role !== 'committee') {
      return res.status(403).json({
        message: 'Only committee members can access assigned complaints stats',
      });
    }

    const category = resolveCommitteeCategory(user.committeeType);
    
    if (!category) {
      return res.status(200).json({
        total: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0,
        rejected: 0,
      });
    }

    // For ICC, query both "Internal Complaints Committee" and legacy "Internal Complaints"
    const categoryQuery = normalizeCategory(category) === 'Internal Complaints Committee'
      ? { $in: ['Internal Complaints Committee', 'Internal Complaints'] }
      : category;

    // Get counts by status
    const [total, pending, inProgress, resolved, rejected] = await Promise.all([
      Complaint.countDocuments({ category: categoryQuery }),
      Complaint.countDocuments({ category: categoryQuery, status: 'pending' }),
      Complaint.countDocuments({ category: categoryQuery, status: 'in-progress' }),
      Complaint.countDocuments({ category: categoryQuery, status: 'resolved' }),
      Complaint.countDocuments({ category: categoryQuery, status: 'rejected' }),
    ]);

    res.status(200).json({
      total,
      pending,
      inProgress,
      resolved,
      rejected,
      category,
    });
  } catch (error) {
    console.error('Get Assigned Complaints Stats Error:', error);
    res.status(500).json({
      message: error.message || 'Failed to fetch complaint statistics',
    });
  }
};

/**
 * Get complaints assigned to the logged-in committee
 * GET /api/complaints/assigned
 */
export const getAssignedComplaints = async (req, res) => {
  try {
    const user = req.user;
    
    // Check if user is a committee member
    if (user.role !== 'committee') {
      return res.status(403).json({
        message: 'Only committee members can access assigned complaints',
      });
    }

    const category = resolveCommitteeCategory(user.committeeType);
    
    if (!category) {
      return res.status(200).json({
        complaints: [],
        message: `No category mapping found for committee type: ${user.committeeType}`,
      });
    }

    // Find complaints assigned to this committee's category
    // For ICC, query both "Internal Complaints Committee" and legacy "Internal Complaints"
    const categoryQuery = normalizeCategory(category) === 'Internal Complaints Committee'
      ? { $in: ['Internal Complaints Committee', 'Internal Complaints'] }
      : category;
    
    // Note: We will sort in-memory by upvotes (desc) then by creation date (desc)
    const complaints = await Complaint.find({ category: categoryQuery })
      .populate('userId', 'name email')
      .select('-__v');
    
    // Sort by upvote count (descending), then by createdAt (newest first)
    complaints.sort((a, b) => {
      const aUpvotes = a.upvotes?.length || 0;
      const bUpvotes = b.upvotes?.length || 0;
      if (bUpvotes !== aUpvotes) {
        return bUpvotes - aUpvotes;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Format complaints to hide user identity if anonymous
    const formattedComplaints = complaints.map((complaint) => {
      const complaintObj = complaint.toObject();
      // Include upvoteCount for UI convenience
      complaintObj.upvoteCount = complaint.upvotes?.length || 0;
      
      // If anonymous, hide user details
      if (complaint.isAnonymous) {
        complaintObj.userId = {
          name: 'Anonymous',
          email: null,
        };
      }
      
      return complaintObj;
    });

    res.status(200).json({
      complaints: formattedComplaints,
      committeeType: user.committeeType,
      category,
    });
  } catch (error) {
    console.error('Get Assigned Complaints Error:', error);
    res.status(500).json({
      message: error.message || 'Failed to fetch assigned complaints',
    });
  }
};

/**
 * Get analytics for a given committee type (by param)
 * GET /api/committee-analytics/:committeeType
 */
export const getCommitteeAnalytics = async (req, res) => {
  try {
    const { committeeType } = req.params;

    const category = resolveCommitteeCategory(committeeType);

    if (!category) {
      // If no category mapping is found, return zeros for the requested fields
      return res.status(200).json({
        categoryCounts: [],
        priorityCounts: { High: 0, Medium: 0, Low: 0 },
        statusCounts: { pending: 0, 'in-progress': 0, resolved: 0 },
        dailyCounts30Days: [],
      });
    }

    // Prepare date range for last 30 days (inclusive)
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 29); // last 30 calendar days including today
    startDate.setHours(0, 0, 0, 0);

    // Helper to build a flexible category match (exact or case-insensitive or substring)
    const matchCategory = (val) => {
      if (!val || typeof val !== 'string') return {};
      const normalized = normalizeCategory(val);
      
      // For ICC, match both "Internal Complaints Committee" and legacy "Internal Complaints"
      if (normalized === 'Internal Complaints Committee') {
        return {
          category: { $in: ['Internal Complaints Committee', 'Internal Complaints'] }
        };
      }
      
      const escaped = val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return {
        $or: [
          { category: val },
          { category: { $regex: new RegExp(`^${escaped}$`, 'i') } },
          { category: { $regex: new RegExp(escaped, 'i') } },
        ],
      };
    };

    const baseMatch = matchCategory(category);

    // Aggregations (use MongoDB aggregation pipelines)
    // 1) categoryCounts: counts grouped by category (top categories)
    const categoryCountsAgg = await Complaint.aggregate([
      { $match: baseMatch },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, category: '$_id', count: 1 } },
    ]);

    // 2) priorityCounts: counts grouped by priority
    const priorityAgg = await Complaint.aggregate([
      { $match: baseMatch },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    // Convert priorityAgg to object with explicit keys
    const priorityCounts = { High: 0, Medium: 0, Low: 0 };
    for (const p of priorityAgg) {
      const key = (p._id || '').toString();
      if (key === 'High' || key === 'Medium' || key === 'Low') {
        priorityCounts[key] = p.count;
      }
    }

    // 3) statusCounts: counts grouped by status (only pending, in-progress, resolved)
    const statusAgg = await Complaint.aggregate([
      { $match: baseMatch },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const statusCounts = { pending: 0, 'in-progress': 0, resolved: 0 };
    for (const s of statusAgg) {
      const key = (s._id || '').toString();
      if (key === 'pending' || key === 'in-progress' || key === 'resolved') {
        statusCounts[key] = s.count;
      }
    }

    // 4) dailyCounts30Days: counts per day for last 30 days
    const dailyAgg = await Complaint.aggregate([
      { $match: { $and: [ baseMatch, { createdAt: { $gte: startDate, $lte: endDate } } ] } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, date: '$_id', count: 1 } },
      { $sort: { date: 1 } },
    ]);

    // Compute KPI totals: total, resolved, avgResolutionTimeDays, resolutionRate
    // total: count of complaints matching baseMatch
    const total = await Complaint.countDocuments(baseMatch);

    // resolved: complaints where status is 'resolved' or statusHistory contains a 'resolved' entry
    const resolvedMatch = { $and: [ baseMatch, { $or: [ { status: 'resolved' }, { statusHistory: { $elemMatch: { status: 'resolved' } } } ] } ] };
    const resolvedDocs = await Complaint.find(resolvedMatch).select('createdAt statusHistory updatedAt').lean();
    const resolved = resolvedDocs.length;

    // Compute average resolution time (days) from createdAt -> resolvedAt (statusHistory.updatedAt or updatedAt fallback)
    let totalResolutionDays = 0;
    for (const c of resolvedDocs) {
      let resolvedAt = null;
      if (Array.isArray(c.statusHistory) && c.statusHistory.length) {
        const resolvedEntry = c.statusHistory.find((s) => s && s.status === 'resolved' && s.updatedAt);
        if (resolvedEntry && resolvedEntry.updatedAt) resolvedAt = resolvedEntry.updatedAt;
      }
      if (!resolvedAt) resolvedAt = c.updatedAt || null;
      if (resolvedAt && c.createdAt) {
        const created = new Date(c.createdAt);
        const r = new Date(resolvedAt);
        const diffMs = r - created;
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (!isNaN(diffDays) && diffDays >= 0) totalResolutionDays += diffDays;
      }
    }
    const avgResolutionTimeDays = resolved > 0 ? +(totalResolutionDays / resolved).toFixed(2) : 0;
    const resolutionRate = total > 0 ? +((resolved / total) * 100).toFixed(2) : 0;

    // Fill missing dates with zero counts to ensure last 30 days continuity
    const dailyMap = new Map(dailyAgg.map((d) => [d.date, d.count]));
    const dailyCounts30Days = [];
    for (let i = 0; i < 30; i++) {
      const dt = new Date(startDate);
      dt.setDate(startDate.getDate() + i);
      const isoDate = dt.toISOString().slice(0, 10);
      dailyCounts30Days.push({ date: isoDate, count: dailyMap.get(isoDate) || 0 });
    }

    // Build dynamic subcategoryCounts by classifying each complaint (title+description)
    const complaintsForSub = await Complaint.find(baseMatch).select('title description status statusHistory updatedAt').lean();
    const subCounts = {};
    const subResolvedCounts = {};
    if (complaintsForSub && complaintsForSub.length) {
      const classificationPromises = complaintsForSub.map((c) =>
        classifySubcategory(c.title || '', c.description || '', category)
          .then((label) => ({ label: label || 'Other', complaint: c }))
          .catch((e) => {
            console.warn('Subcategory classification failed for complaint:', e?.message || e);
            return { label: 'Other', complaint: c };
          })
      );
      const results = await Promise.all(classificationPromises);
      for (const { label, complaint } of results) {
        subCounts[label] = (subCounts[label] || 0) + 1;
        // Consider resolved if status is 'resolved' or statusHistory contains resolved
        const isResolved = complaint?.status === 'resolved' || (Array.isArray(complaint?.statusHistory) && complaint.statusHistory.some((s) => s && s.status === 'resolved'));
        if (isResolved) {
          subResolvedCounts[label] = (subResolvedCounts[label] || 0) + 1;
        }
      }
    }

    // Debugging: log how many documents matched each aggregation (non-intrusive)
    try {
      console.debug('[Analytics] category=', category);
      console.debug('[Analytics] baseMatch=', JSON.stringify(baseMatch));
      console.debug('[Analytics] categoryCountsAgg=', categoryCountsAgg.length);
      console.debug('[Analytics] priorityAgg=', priorityAgg.length);
      console.debug('[Analytics] statusAgg=', statusAgg.length);
      console.debug('[Analytics] dailyAgg=', dailyAgg.length);
    } catch (e) {
      // ignore logging errors
    }

    // Return analytics fields plus KPI values required by frontend
    return res.status(200).json({
      categoryCounts: categoryCountsAgg,
      priorityCounts,
      statusCounts,
      dailyCounts30Days,
      // Dynamic subcategory counts (key = subcategory label, value = count)
      subcategoryCounts: subCounts,
      // Resolved counts per subcategory (for overlay bars)
      subcategoryResolvedCounts: subResolvedCounts,
      // KPI values (kept for frontend KPI cards)
      total,
      resolved,
      avgResolutionTimeDays,
      resolutionRate,
    });
  } catch (error) {
    console.error('Get Committee Analytics Error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch committee analytics' });
  }
};

/**
 * Upvote a public complaint
 * POST /api/complaints/:id/upvote
 */
export const upvoteComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find the complaint
    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({
        message: 'Complaint not found',
      });
    }

    // Only allow upvoting public complaints
    if (complaint.type !== 'general') {
      return res.status(403).json({
        message: 'Only public complaints can be upvoted',
      });
    }

    // Check if user has already upvoted (compare as strings)
    const hasUpvoted = complaint.upvotes?.some(
      (upvoteId) => upvoteId.toString() === userId.toString()
    );

    if (hasUpvoted) {
      // Remove upvote (toggle off)
      complaint.upvotes = complaint.upvotes.filter(
        (upvoteId) => upvoteId.toString() !== userId.toString()
      );
    } else {
      // Add upvote
      if (!complaint.upvotes) {
        complaint.upvotes = [];
      }
      // Check if user ID is not already in the array
      if (!complaint.upvotes.some((id) => id.toString() === userId.toString())) {
        complaint.upvotes.push(userId);
      }
    }

    await complaint.save();

    // Update priority based on upvote count
    const newPriority = await updatePriorityBasedOnUpvotes(complaint);

    res.status(200).json({
      message: hasUpvoted ? 'Upvote removed' : 'Complaint upvoted successfully',
      upvoteCount: complaint.upvotes.length,
      hasUpvoted: !hasUpvoted,
      priority: newPriority,
    });
  } catch (error) {
    console.error('Upvote Complaint Error:', error);
    res.status(500).json({
      message: error.message || 'Failed to upvote complaint',
    });
  }
};

/**
 * Get a single complaint by ID
 * GET /api/complaints/:id
 */
export const getComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const complaint = await Complaint.findById(id)
      .populate('userId', 'name email')
      .populate('statusHistory.updatedBy', 'name email')
      .select('-__v');

    if (!complaint) {
      return res.status(404).json({
        message: 'Complaint not found',
      });
    }

    const isOwner = complaint.userId?._id
      ? complaint.userId._id.toString() === user._id.toString()
      : complaint.userId?.toString() === user._id.toString();

    const canView =
      isOwner ||
      complaint.type === 'general' ||
      user.role === 'admin' ||
      user.role === 'committee';

    if (!canView) {
      return res.status(403).json({
        message: 'You do not have permission to view this complaint',
      });
    }

    const complaintData = complaint.toObject();

    if (!isOwner && complaint.isAnonymous) {
      complaintData.userId = {
        name: 'Anonymous',
        email: null,
      };
    }

    res.status(200).json({
      complaint: complaintData,
    });
  } catch (error) {
    console.error('Get Complaint Error:', error);
    res.status(500).json({
      message: error.message || 'Failed to fetch complaint',
    });
  }
};

/**
 * Delete a complaint (Students can delete their own complaints only)
 * DELETE /api/complaints/:id
 */
export const deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Only students are allowed to delete complaints
    if (user.role !== 'student') {
      return res.status(403).json({
        message: 'Only students can delete complaints',
      });
    }

    // Find the complaint belonging to the logged-in student
    const complaint = await Complaint.findOne({ _id: id, userId: user._id });

    if (!complaint) {
      return res.status(404).json({
        message: 'Complaint not found',
      });
    }

    const normalizedStatus = (complaint.status || '').toLowerCase();
    if (normalizedStatus === 'resolved') {
      return res.status(400).json({
        message: 'Resolved complaints cannot be deleted',
      });
    }

    // --- NEW CODE STARTS HERE: Delete attachments from Cloudinary ---
    if (complaint.attachments && complaint.attachments.length > 0) {
      const deletePromises = complaint.attachments.map((fileUrl) => 
        deleteFromCloudinary(fileUrl)
      );
      // We await all file deletions. 
      // Using Promise.allSettled ensures one failure doesn't stop others.
      await Promise.allSettled(deletePromises);
    }
    // --- NEW CODE ENDS HERE ---

    // Remove associated notifications (if any) before deleting the complaint
    try {
      await Notification.deleteMany({ complaint: complaint._id });
    } catch (notificationError) {
      console.warn('Failed to delete related notifications:', notificationError);
    }

    await complaint.deleteOne();

    res.status(200).json({
      message: 'Complaint deleted successfully',
    });
  } catch (error) {
    console.error('Delete Complaint Error:', error);
    res.status(500).json({
      message: error.message || 'Failed to delete complaint',
    });
  }
};

/**
 * Get all complaints (Admin only)
 * GET /api/complaints/all
 */
export const getAllComplaints = async (req, res) => {
  try {
    const user = req.user;
    
    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({
        message: 'Only admins can access all complaints',
      });
    }

    // Fetch all complaints with user details
    const complaints = await Complaint.find({})
      .sort({ createdAt: -1 })
      .populate('userId', 'name email')
      .populate('statusHistory.updatedBy', 'name email')
      .select('-__v');

    // Format complaints to hide user identity if anonymous
    const formattedComplaints = complaints.map((complaint) => {
      const complaintObj = complaint.toObject();
      
      // If anonymous, hide user details
      if (complaint.isAnonymous) {
        complaintObj.userId = {
          name: 'Anonymous',
          email: null,
        };
      }
      
      return complaintObj;
    });

    res.status(200).json({
      complaints: formattedComplaints,
      total: formattedComplaints.length,
    });
  } catch (error) {
    console.error('Get All Complaints Error:', error);
    res.status(500).json({
      message: error.message || 'Failed to fetch all complaints',
    });
  }
};

/**
 * Update complaint status with description (Admin and Committee)
 * PATCH /api/complaints/:id/status
 */
export const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, description } = req.body;
    const user = req.user;

    // Validate status
    const validStatuses = ['pending', 'in-progress', 'resolved', 'rejected'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid status. Must be one of: pending, in-progress, resolved, rejected',
      });
    }

    // Validate description
    if (!description || description.trim().length === 0) {
      return res.status(400).json({
        message: 'Description is required when updating status',
      });
    }

    // Check if user is admin or committee
    if (user.role !== 'admin' && user.role !== 'committee') {
      return res.status(403).json({
        message: 'Only admins and committee members can update complaint status',
      });
    }

    // Find the complaint
    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({
        message: 'Complaint not found',
      });
    }

    // If committee, verify they have access to this complaint's category
    if (user.role === 'committee') {
      const allowedCategory = resolveCommitteeCategory(user.committeeType);
      // Normalize both sides for comparison (handles ICC variations)
      const normalizedComplaintCategory = normalizeCategory(complaint.category);
      const normalizedAllowedCategory = normalizeCategory(allowedCategory);
      
      if (normalizedComplaintCategory !== normalizedAllowedCategory) {
        return res.status(403).json({
          message: 'You do not have permission to update this complaint',
        });
      }
    }

    // Update status and track previous status
    const previousStatus = complaint.status;
    complaint.status = status;
    complaint.statusUpdatedAt = Date.now();

    // Add to status history
    complaint.statusHistory.push({
      status: status,
      description: description.trim(),
      updatedBy: user._id,
      updatedAt: new Date(),
    });

    await complaint.save();

    // Populate the updated complaint
    await complaint.populate('userId', 'name email');
    await complaint.populate('statusHistory.updatedBy', 'name email');

    // If the status actually changed, create a notification and send an email
    if (previousStatus !== status) {
      try {
        const message = `Your complaint \"${complaint.title}\" status was updated to ${status}.`;
        await Notification.create({
          user: complaint.userId._id || complaint.userId,
          complaint: complaint._id,
          type: 'status_update',
          message,
          data: { status, description: description.trim() },
        });

        if (complaint.userId && complaint.userId.email) {
          sendStatusUpdateEmail(complaint.userId.email, complaint.title, status, description.trim())
            .catch((err) => console.error('Failed to send status update email:', err));
        }
      } catch (notifyErr) {
        console.error('Failed to create/send notification:', notifyErr);
      }
    }

    res.status(200).json({
      message: 'Complaint status updated successfully',
      complaint: complaint.toObject(),
    });
  } catch (error) {
    console.error('Update Complaint Status Error:', error);
    res.status(500).json({
      message: error.message || 'Failed to update complaint status',
    });
  }
};

/**
 * Get all available committees
 * GET /api/committees
 */
export const getCommittees = async (req, res) => {
  try {
    // Return the list of valid committee categories
    const committees = [
      'Internal Complaints Committee',
      'Hostel Management',
      'Cafeteria',
      'Tech-Support',
      'Sports',
      'Academic',
      'Annual Fest',
      'Cultural',
      'Student Placement',
      'Admin'
    ];

    res.status(200).json({
      committees,
    });
  } catch (error) {
    console.error('Get Committees Error:', error);
    res.status(500).json({
      message: error.message || 'Failed to fetch committees',
    });
  }
};

/**
 * Forward a complaint to another committee (Committee only)
 * PUT /api/complaints/:id/forward
 */
export const forwardComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { newCommitteeId } = req.body;
    const user = req.user;

    // Validate that user is a committee member
    if (user.role !== 'committee') {
      return res.status(403).json({
        message: 'Only committee members can forward complaints',
      });
    }

    // Validate newCommitteeId
    if (!newCommitteeId || typeof newCommitteeId !== 'string') {
      return res.status(400).json({
        message: 'newCommitteeId is required and must be a string',
      });
    }

    // Find the complaint
    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({
        message: 'Complaint not found',
      });
    }

    // Validate that the new committee is a valid category
    const validCategories = [
      'Internal Complaints Committee',
      'Internal Complaints',
      'Hostel Management',
      'Cafeteria',
      'Tech-Support',
      'Sports',
      'Academic',
      'Annual Fest',
      'Cultural',
      'Student Placement',
      'Admin'
    ];

    if (!validCategories.includes(newCommitteeId)) {
      return res.status(400).json({
        message: 'Invalid committee. Please select a valid committee.',
      });
    }

    // Verify that the user belongs to the committee that currently has the complaint
    const allowedCategory = resolveCommitteeCategory(user.committeeType);
    const normalizedComplaintCategory = normalizeCategory(complaint.category);
    const normalizedAllowedCategory = normalizeCategory(allowedCategory);

    if (normalizedComplaintCategory !== normalizedAllowedCategory) {
      return res.status(403).json({
        message: 'You do not have permission to forward this complaint. It is not assigned to your committee.',
      });
    }

    // Prevent forwarding to the same committee
    if (normalizeCategory(newCommitteeId) === normalizedComplaintCategory) {
      return res.status(400).json({
        message: 'Cannot forward complaint to the same committee',
      });
    }

    // Store the old committee before updating
    const oldCommittee = complaint.category;

    // Update the complaint category
    complaint.category = newCommitteeId;

    // Ensure history array exists
    if (!complaint.history) {
      complaint.history = [];
    }

    // Append to history
    complaint.history.push({
      action: 'MANUAL_FORWARD',
      fromCommittee: oldCommittee,
      toCommittee: newCommitteeId,
      timestamp: new Date(),
      performedBy: user._id,
    });

    await complaint.save();

    // Populate the updated complaint
    await complaint.populate('userId', 'name email');
    await complaint.populate('history.performedBy', 'name email');

    // Create notifications for the new committee members
    try {
      const normalizedNewCategory = normalizeCategory(newCommitteeId);
      const committeeUsers = await User.find({ role: 'committee' }).select('_id committeeType name email');
      const recipients = committeeUsers.filter((u) => {
        const userCategory = resolveCommitteeCategory(u.committeeType);
        return normalizeCategory(userCategory) === normalizedNewCategory;
      });

      if (recipients.length > 0) {
        const notifPromises = recipients.map((r) => {
          const message = `Complaint "${complaint.title}" has been forwarded to your committee.`;
          return Notification.create({
            user: r._id,
            complaint: complaint._id,
            type: 'general',
            message,
            data: { assignedCategory: newCommitteeId, complaintId: complaint._id, assignedTo: r._id },
          });
        });

        await Promise.all(notifPromises);
      }
    } catch (notifyErr) {
      console.error('Failed to create committee notifications:', notifyErr);
      // Don't fail the request if notification creation fails
    }

    res.status(200).json({
      message: 'Complaint forwarded successfully',
      complaint: complaint.toObject(),
    });
  } catch (error) {
    console.error('Forward Complaint Error:', error);
    res.status(500).json({
      message: error.message || 'Failed to forward complaint',
    });
  }
};

