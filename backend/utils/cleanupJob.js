import cron from "node-cron";
import Complaint from "../models/Complaint.js";

export const startCleanupJob = () => {
  cron.schedule("0 0 * * *", async () => {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await Complaint.deleteMany({
      status: { $in: ["resolved", "rejected"] },
      statusUpdatedAt: { $lte: cutoff }
    });
  });
};

