import mongoose, { Schema, type Document, type Model } from "mongoose";

export type ReportTemplateType =
  | "initial-assessment"
  | "follow-up-counseling"
  | "final-counseling"
  | "general-wellness";

export interface ICounselorReport extends Document {
  officerId: mongoose.Types.ObjectId;
  counselorId: mongoose.Types.ObjectId;
  sessionId?: mongoose.Types.ObjectId;
  prescriptionId?: mongoose.Types.ObjectId;
  templateType: ReportTemplateType;
  title: string;
  assessmentResult?: string;
  counselorNotes?: string;
  sessionSummary?: string;
  recommendations?: string;
  reportDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CounselorReportSchema = new Schema<ICounselorReport>(
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
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "CounselingSession",
    },
    prescriptionId: {
      type: Schema.Types.ObjectId,
      ref: "Prescription",
    },
    templateType: {
      type: String,
      enum: [
        "initial-assessment",
        "follow-up-counseling",
        "final-counseling",
        "general-wellness",
      ],
      default: "general-wellness",
    },
    title: {
      type: String,
      required: true,
    },
    assessmentResult: { type: String },
    counselorNotes: { type: String },
    sessionSummary: { type: String },
    recommendations: { type: String },
    reportDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const CounselorReport: Model<ICounselorReport> =
  mongoose.models.CounselorReport ||
  mongoose.model<ICounselorReport>("CounselorReport", CounselorReportSchema);

export default CounselorReport;
