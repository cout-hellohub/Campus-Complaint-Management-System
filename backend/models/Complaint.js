import mongoose from 'mongoose';

const ComplaintSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    category: {
        // Auto-routed by Gemini AI
        type: String,
        enum: [
            'Internal Complaints Committee',
            'Internal Complaints', // Legacy name for backward compatibility
            'Hostel Management',
            'Cafeteria',
            'Tech-Support',
            'Sports',
            'Academic',
            'Annual Fest',
            'Cultural',
            'Student Placement',
            'Admin'
        ],
        required: true,
    },
    priority: {
        // Auto-routed by Gemini AI
        type: String,
        enum: ['High', 'Medium', 'Low'],
        default: 'Medium',
    },
    location: {
        type: String,
        trim: true,
        default: '',
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'resolved', 'rejected'],
        default: 'pending',
    },
    response: {
        type: String,
        default: '',
    },
    // --- NEW FIELDS ADDED BELOW ---
    isAnonymous: {
        type: Boolean,
        default: false,
    },
    type: {
        // 'general' complaints are public and upvotable
        type: String,
        enum: ['general', 'personal'],
        default: 'general',
    },
    upvotes: {
        // Array of user IDs who have upvoted this complaint
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: [],
    },
    attachments: {
        // Array to store local file paths (from Multer) or cloud storage URLs
        type: [String],
        default: [],
    },
    statusHistory: {
        // Track status changes with descriptions
        type: [{
            status: {
                type: String,
                enum: ['pending', 'in-progress', 'resolved', 'rejected'],
                required: true,
            },
            description: {
                type: String,
                default: '',
            },
            updatedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            updatedAt: {
                type: Date,
                default: Date.now,
            }
        }],
        default: [],
    },
    history: {
        // Track complaint actions (forwarding, etc.)
        type: [{
            action: {
                type: String,
                required: true,
            },
            fromCommittee: {
                type: String,
            },
            toCommittee: {
                type: String,
            },
            timestamp: {
                type: Date,
                default: Date.now,
            },
            performedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            }
        }],
        default: [],
    }
}, { timestamps: true });

export default mongoose.model('Complaint', ComplaintSchema);

