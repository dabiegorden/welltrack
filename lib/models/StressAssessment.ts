import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IStressQuestion {
  questionId: number;
  question: string;
  score: number; // 0-4 Likert scale
}

export interface IStressAssessment extends Document {
  officerId: mongoose.Types.ObjectId;
  questions: IStressQuestion[];
  totalScore: number;
  stressLevel: "low" | "moderate" | "high";
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StressQuestionSchema = new Schema<IStressQuestion>(
  {
    questionId: {
      type: Number,
      required: true,
    },
    question: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 4,
    },
  },
  { _id: false }
);

const StressAssessmentSchema = new Schema<IStressAssessment>(
  {
    officerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    questions: [StressQuestionSchema],
    totalScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    stressLevel: {
      type: String,
      enum: ["low", "moderate", "high"],
      required: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const StressAssessment: Model<IStressAssessment> =
  mongoose.models.StressAssessment ||
  mongoose.model<IStressAssessment>("StressAssessment", StressAssessmentSchema);

export default StressAssessment;
