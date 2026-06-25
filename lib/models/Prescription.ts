import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IPrescription extends Document {
  officerId: mongoose.Types.ObjectId;
  counselorId: mongoose.Types.ObjectId;
  sessionId?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  supportPlan?: string;
  followUpDate?: Date;
  status: "active" | "completed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const PrescriptionSchema = new Schema<IPrescription>(
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
    title: {
      type: String,
      required: true,
    },
    description: { type: String },
    supportPlan: { type: String },
    followUpDate: { type: Date },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
  },
  { timestamps: true }
);

const Prescription: Model<IPrescription> =
  mongoose.models.Prescription ||
  mongoose.model<IPrescription>("Prescription", PrescriptionSchema);

export default Prescription;
