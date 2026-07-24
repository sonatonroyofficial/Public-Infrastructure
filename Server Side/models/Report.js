import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },
    category: { 
        type: String, 
        required: true 
    },
    location: {
        address: { type: String, default: '' },
        latitude: { type: Number, default: null },
        longitude: { type: Number, default: null }
    },
    latitude: {
        type: Number,
        default: null
    },
    longitude: {
        type: Number,
        default: null
    },
    district: {
        type: String,
        default: null
    },
    geocodingStatus: {
        type: String,
        enum: ["pending", "success", "failed"],
        default: "pending"
    },
    description: { 
        type: String, 
        required: true 
    },
    photos: [{ 
        type: String 
    }],
    citizenId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    citizenName: { 
        type: String, 
        default: '' 
    },
    citizenEmail: { 
        type: String, 
        required: true 
    },
    isPremiumIssue: { 
        type: Boolean, 
        default: false 
    },
    status: { 
        type: String, 
        enum: ['pending', 'assigned', 'in-progress', 'resolved', 'closed', 'rejected'], 
        default: 'pending' 
    },
    assignedTo: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        default: null 
    },
    assignedStaffName: { 
        type: String, 
        default: null 
    },
    priority: { 
        type: String, 
        enum: ['high', 'normal', 'low'], 
        default: 'normal' 
    },
    comments: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        userName: String,
        comment: String,
        timestamp: { type: Date, default: Date.now }
    }],
    statusHistory: [{
        status: String,
        updatedBy: String,
        updatedByRole: String,
        timestamp: { type: Date, default: Date.now },
        comment: String
    }],
    
    // AI Integration Fields (Phase 1)
    originalText: { 
        type: String, 
        default: '' // raw text exactly as citizen typed it, any language
    },
    detectedLanguage: { 
        type: String, 
        default: '' // e.g. "bn", "en", "banglish", "mixed"
    },
    aiCategory: { 
        type: String, 
        enum: ["Pothole", "Water Leak", "Illegal Dumping", "Broken Streetlight", "Damaged Footpath", "Other"],
        default: 'Other'
    },
    specificIssueLabel: {
        type: String,
        default: '' // human-readable 2-4 word label, e.g. "Fire Hazard", "Gas Leak"
    },
    aiCategoryConfidence: { 
        type: Number, 
        default: 0 // 0-1
    },
    aiSummaryEn: { 
        type: String, 
        default: '' // clean English summary, admin-facing
    },
    severityScore: { 
        type: Number, 
        default: 1 // 1-10
    },
    severityLabel: { 
        type: String, 
        enum: ["Low", "Medium", "High", "Critical"],
        default: 'Low'
    },
    severityReason: { 
        type: String, 
        default: '' // short English explanation of the score
    },
    isIncomplete: { 
        type: Boolean, 
        default: false // true if AI thinks the report lacks enough info
    },
    missingInfoNote: { 
        type: String, 
        default: '' // what's missing, e.g. "no clear location mentioned"
    },
    duplicateOf: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Report', 
        default: null // ref to another Report, nullable
    },
    duplicateConfidence: { 
        type: Number, 
        default: null // 0-1, nullable
    },
    duplicateStatus: { 
        type: String, 
        enum: ["none", "possible_duplicate", "confirmed_duplicate"],
        default: 'none'
    },
    aiProcessedAt: { 
        type: Date, 
        default: null 
    },
    aiProcessingStatus: { 
        type: String, 
        enum: ["pending", "processing", "done", "failed"],
        default: 'pending'
    }
}, {
    timestamps: true
});

export default mongoose.models.Report || mongoose.model('Report', ReportSchema);
