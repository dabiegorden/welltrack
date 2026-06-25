import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ICounselingSession extends Document {
  officerId: mongoose.Types.ObjectId;
  counselorId: mongoose.Types.ObjectId;
  appointmentId?: mongoose.Types.ObjectId;
  assessmentId?: mongoose.Types.ObjectId;
  sessionDate: Date;
  // "What went on between the counselor and the officer"
  sessionDiscussion?: string;
  officerConcerns?: string;
  counselorObservations?: string;
  counselingNotes?: string;
  sessionSummary?: string;
  followUpStatus: "none" | "pending" | "scheduled" | "completed";
  followUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CounselingSessionSchema = new Schema<ICounselingSession>(
  {
    officerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    counselorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
    },
    assessmentId: {
      type: Schema.Types.ObjectId,
      ref: "AssessmentResponse",
    },
    sessionDate: {
      type: Date,
      default: Date.now,
    },
    sessionDiscussion: { type: String },
    officerConcerns: { type: String },
    counselorObservations: { type: String },
    counselingNotes: { type: String },
    sessionSummary: { type: String },
    followUpStatus: {
      type: String,
      enum: ["none", "pending", "scheduled", "completed"],
      default: "none",
    },
    followUpDate: { type: Date },
  },
  { timestamps: true }
);

const CounselingSession: Model<ICounselingSession> =
  mongoose.models.CounselingSession ||
  mongoose.model<ICounselingSession>(
    "CounselingSession",
    CounselingSessionSchema
  );

export default CounselingSession;
