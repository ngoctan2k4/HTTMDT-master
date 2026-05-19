import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
    buyerId: { type: String, required: true, index: true },
    sellerId: { type: String, required: true, index: true },
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    
    // O2O Status Tracking
    status: { 
        type: String, 
        enum: ["pending", "confirmed", "completed", "cancelled"], 
        default: "pending" 
    },
    
    // Scheduled meeting time
    appointmentDate: { type: Date, required: true },
    
    // Review/Feedback workflow
    rating: { type: Number, min: 1, max: 5 },
    reviewStatus: { 
        type: String, 
        enum: ["pending", "submitted", "ignored"], 
        default: "pending" 
    },
    isFraudReported: { type: Boolean, default: false },
    notes: { type: String },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update the `updatedAt` field on save
appointmentSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

export const Appointment = mongoose.models.Appointment || mongoose.model("Appointment", appointmentSchema);
