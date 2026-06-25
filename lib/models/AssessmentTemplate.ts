import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IAssessmentAnswerOption {
  label: string;
  points: number;
}

export interface IAssessmentQuestion {
  text: string;
  category: "workload" | "support" | "wellbeing" | "environment";
  options?: IAssessmentAnswerOption[];
  isActive?: boolean;
}

// Default 4-point Likert answer options used when a question has none defined
export const DEFAULT_ANSWER_OPTIONS: IAssessmentAnswerOption[] = [
  { label: "Never", points: 1 },
  { label: "Sometimes", points: 2 },
  { label: "Often", points: 3 },
  { label: "Always", points: 4 },
];

export interface IAssessmentTemplate extends Document {
  name: string;
  description: string;
  questions: IAssessmentQuestion[];
  maxScore: number;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AssessmentQuestionSchema = new Schema<IAssessmentQuestion>(
  {
    text: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["workload", "support", "wellbeing", "environment"],
      required: true,
    },
    options: [
      new Schema<IAssessmentAnswerOption>(
        {
          label: { type: String, required: true },
          points: { type: Number, required: true, min: 0 },
        },
        { _id: false }
      ),
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true } // Allow MongoDB to auto-generate _id for subdocuments
);

const AssessmentTemplateSchema = new Schema<IAssessmentTemplate>(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    questions: [AssessmentQuestionSchema],
    maxScore: {
      type: Number,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const AssessmentTemplate: Model<IAssessmentTemplate> =
  mongoose.models.AssessmentTemplate ||
  mongoose.model<IAssessmentTemplate>(
    "AssessmentTemplate",
    AssessmentTemplateSchema
  );

export default AssessmentTemplate;
