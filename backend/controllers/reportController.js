import PDFDocument from "pdfkit";
import Complaint from "../models/Complaint.js";
import { resolveCommitteeCategory } from "./complaintController.js";
const REPORT_TIMEZONE = process.env.REPORT_TIMEZONE || "Asia/Kolkata";
const REPORT_LOCALE = process.env.REPORT_LOCALE || "en-IN";

function date30DaysAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d;
}

const formatReportTimestamp = () =>
  new Intl.DateTimeFormat(REPORT_LOCALE, {
    timeZone: REPORT_TIMEZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

export const generateMonthlyCommitteeReport = async (req, res) => {
  try {
    const { committeeType } = req.query;
    if (!committeeType) {
      return res.status(400).json({ message: "committeeType is required" });
    }

    // IMPORTANT: Map committee name → complaint category (Hostel → Hostel Management)
    const category = resolveCommitteeCategory(committeeType);

    if (!category) {
      return res.status(200).json({ message: "Invalid committee type" });
    }

    const fromDate = date30DaysAgo();

    // Fetch complaints USING THE SAME LOGIC AS Assigned Complaints Page
    const complaints = await Complaint.find({
      category,
      createdAt: { $gte: fromDate },
    }).lean();

    // Compute analytics
    const total = complaints.length;
    const resolved = complaints.filter((c) => c.status === "resolved").length;
    const pending = complaints.filter((c) => c.status === "pending").length;
    const inProgress = complaints.filter((c) => c.status === "in-progress").length;

    const high = complaints.filter((c) => c.priority === "High").length;
    const medium = complaints.filter((c) => c.priority === "Medium").length;
    const low = complaints.filter((c) => c.priority === "Low").length;

    // Start PDF
    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=Report.pdf");

    doc.pipe(res);

    doc.fontSize(20).text("Committee Monthly Analytics Report", { underline: true });
    doc.moveDown();
    const generatedAt = formatReportTimestamp();
    doc.fontSize(14).text(`Committee: ${committeeType}`);
    doc.text(`Category Mapped To: ${category}`);
    doc.text(`Report Range: Last 30 Days`);
    doc.text(`Generated At: ${generatedAt}`);
    doc.text(`Created on: ${generatedAt} (${REPORT_TIMEZONE})`);

    doc.moveDown().fontSize(16).text("Summary:");
    doc.fontSize(13).text(`Total Complaints: ${total}`);
    doc.text(`Resolved: ${resolved}`);
    doc.text(`Pending: ${pending}`);
    doc.text(`In Progress: ${inProgress}`);

    doc.moveDown().fontSize(16).text("Priority Breakdown:");
    doc.fontSize(13).text(`High: ${high}`);
    doc.text(`Medium: ${medium}`);
    doc.text(`Low: ${low}`);

    doc.moveDown().fontSize(16).text("5. Recent Complaints:");

    complaints.slice(0, 10).forEach((c, idx) => {
      doc.fontSize(12).text(
        `${idx + 1}. ${c.title}  [${c.priority}]  (${c.status})`
      );
    });

    // Top-Priority Complaints (sorted by upvote count, highest first)
    const topPriorityComplaints = [...complaints]
      .sort((a, b) => {
        const aUpvotes = a.upvoteCount || a.upvotes?.length || 0;
        const bUpvotes = b.upvoteCount || b.upvotes?.length || 0;
        if (aUpvotes !== bUpvotes) {
          return bUpvotes - aUpvotes; // Descending order
        }
        // Tie-breaker: newer complaints first
        return new Date(b.createdAt) - new Date(a.createdAt);
      })
      .slice(0, 15);

    doc.moveDown().fontSize(16).text("6. Top-Priority Complaints:");
    if (topPriorityComplaints.length === 0) {
      doc.fontSize(12).text('No complaints available.');
    } else {
      topPriorityComplaints.forEach((c, i) => {
        const upvotes = c.upvoteCount || c.upvotes?.length || 0;
        doc.fontSize(12).text(`${i+1}. ${c.title} [${c.priority || 'N/A'}] (${c.status}) | Upvotes: ${upvotes}`);
      });
    }

    doc.end();
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ message: "Failed to generate report" });
  }
};

// Admin report: overall portal + committee-wise snapshot
export const generateMonthlyAdminReport = async (req, res) => {
  try {
    const fromDate = date30DaysAgo();

    // Fetch all complaints in last 30 days
    const complaints = await Complaint.find({ createdAt: { $gte: fromDate } }).lean();

    const total = complaints.length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;
    const pending = complaints.filter(c => c.status === 'pending').length;
    const inProgress = complaints.filter(c => c.status === 'in-progress').length;
    const rejected = complaints.filter(c => c.status === 'rejected').length;

    const priorityCounts = {
      High: complaints.filter(c => c.priority === 'High').length,
      Medium: complaints.filter(c => c.priority === 'Medium').length,
      Low: complaints.filter(c => c.priority === 'Low').length,
    };

    // Committee grouping (reuse categories known in frontend)
    const committees = [
      'Canteen','Cafeteria Management Committee','Hostel','Sports','Tech','Academic','Internal Complaints','Annual Fest','Cultural','Placement','Admin'
    ];
    const committeeMap = {};
    complaints.forEach(c => {
      let catRaw = (c.category || '').trim();
      if (!catRaw) return;

      // Normalize cafeteria naming: map 'Canteen' or any 'Cafeteria*' to unified label
      const lowerCat = catRaw.toLowerCase();
      if (lowerCat === 'canteen' || lowerCat.startsWith('cafeteria')) {
        catRaw = 'Cafeteria Management Committee';
      }

      // Attempt direct match first, else loose match
      let matched = committees.find(k => k === catRaw) || committees.find(k => catRaw.toLowerCase().includes(k.toLowerCase()));
      if (!matched) return;
      if (!committeeMap[matched]) committeeMap[matched] = { total: 0, resolved: 0, pending: 0 };
      committeeMap[matched].total += 1;
      if (c.status === 'resolved') committeeMap[matched].resolved += 1;
      if (c.status === 'pending') committeeMap[matched].pending += 1;
    });
    const committeeArr = committees.map(k => {
      const data = committeeMap[k] || { total: 0, resolved: 0, pending: 0 };
      return { name: k, ...data, resolutionRate: data.total ? Math.round((data.resolved / data.total) * 100) : 0 };
    }).filter(row => row.total > 0);

    // Top-Priority Complaints (sorted by upvote count, highest first)
    const topPriorityComplaints = [...complaints]
      .sort((a, b) => {
        const aUpvotes = a.upvoteCount || a.upvotes?.length || 0;
        const bUpvotes = b.upvoteCount || b.upvotes?.length || 0;
        if (aUpvotes !== bUpvotes) {
          return bUpvotes - aUpvotes; // Descending order
        }
        // Tie-breaker: newer complaints first
        return new Date(b.createdAt) - new Date(a.createdAt);
      })
      .slice(0, 15);

    // Daily counts last 30 days
    const today = new Date();
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0,10);
      days.push(key);
    }
    const dailyCounts = days.map(dateStr => ({
      date: dateStr,
      count: complaints.filter(c => {
        try { return c.createdAt && new Date(c.createdAt).toISOString().slice(0,10) === dateStr; } catch { return false; }
      }).length
    }));

    // Start PDF stream
    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition','attachment; filename=Admin_Report.pdf');
    doc.pipe(res);

    // Title
    const generatedAt = formatReportTimestamp();
    doc.fontSize(22).text('Campus Complaint Resolve - Admin Monthly Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated: ${generatedAt} (${REPORT_TIMEZONE})`);
    doc.text('Range: Last 30 Days');
    doc.moveDown();

    // Overall Summary
    doc.fontSize(16).text('1. Overall Summary', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Total Complaints: ${total}`);
    doc.text(`Resolved: ${resolved}`);
    doc.text(`Pending: ${pending}`);
    doc.text(`In Progress: ${inProgress}`);
    doc.text(`Rejected: ${rejected}`);
    doc.moveDown();

    // Priority Breakdown
    doc.fontSize(16).text('2. Priority Breakdown', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`High: ${priorityCounts.High}`);
    doc.text(`Medium: ${priorityCounts.Medium}`);
    doc.text(`Low: ${priorityCounts.Low}`);
    doc.moveDown();

    // Daily Trend (show top 10 recent days if large)
    doc.fontSize(16).text('3. Daily Trend (Last 30 Days)', { underline: true });
    doc.moveDown(0.5);
    dailyCounts.slice(-10).forEach(d => {
      doc.fontSize(11).text(`${d.date}: ${d.count}`);
    });
    doc.moveDown();

    // Committee-wise Analytics
    doc.fontSize(16).text('4. Committee-wise Analytics', { underline: true });
    doc.moveDown(0.5);
    if (committeeArr.length === 0) {
      doc.fontSize(12).text('No committee data available.');
    } else {
      committeeArr.forEach((row, idx) => {
        doc.fontSize(11).text(`${idx+1}. ${row.name} | Total: ${row.total} | Resolved: ${row.resolved} | Pending: ${row.pending} | Resolution Rate: ${row.resolutionRate}%`);
      });
    }
    doc.moveDown();

    // Recent Complaints (first 15)
    doc.fontSize(16).text('5. Recent Complaints', { underline: true });
    doc.moveDown(0.5);
    complaints.slice(0,15).forEach((c,i)=>{
      doc.fontSize(11).text(`${i+1}. ${c.title} [${c.priority || 'N/A'}] (${c.status})`);
    });
    doc.moveDown();

    // Top-Priority Complaints (by upvote count)
    doc.fontSize(16).text('6. Top-Priority Complaints', { underline: true });
    doc.moveDown(0.5);
    if (topPriorityComplaints.length === 0) {
      doc.fontSize(12).text('No complaints available.');
    } else {
      topPriorityComplaints.forEach((c, i) => {
        const upvotes = c.upvoteCount || c.upvotes?.length || 0;
        doc.fontSize(11).text(`${i+1}. ${c.title} [${c.priority || 'N/A'}] (${c.status}) | Upvotes: ${upvotes}`);
      });
    }

    doc.end();
  } catch (err) {
    console.error('Admin report generation error', err);
    res.status(500).json({ message: 'Failed to generate admin report' });
  }
};
