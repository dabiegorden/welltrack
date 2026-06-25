import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IRecommendation extends Document {
  officerId: mongoose.Types.ObjectId;
  counselorId: mongoose.Types.ObjectId;
  sessionId?: mongoose.Types.ObjectId;
  type:
    | "further-counseling"
    | "follow-up-session"
    | "reduced-workload"
    | "wellness-improvement"
    | "other";
  details: string;
  createdAt: Date;
  updatedAt: Date;
}

const RecommendationSchema = new Schema<IRecommendation>(
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
    type: {
      type: String,
      enum: [
        "further-counseling",
        "follow-up-session",
        "reduced-workload",
        "wellness-improvement",
        "other",
      ],
      default: "other",
    },
    details: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Recommendation: Model<IRecommendation> =
  mongoose.models.Recommendation ||
  mongoose.model<IRecommendation>("Recommendation", RecommendationSchema);

export default Recommendation;
