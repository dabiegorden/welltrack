import mongoose from "mongoose";

const assessmentResponseSchema = new mongoose.Schema(
  {
    officerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentTemplate",
      required: true,
    },
    responses: [
      {
        questionId: String,
        questionText: String,
        score: {
          type: Number,
          min: 0,
          max: 4,
        },
      },
    ],
    totalScore: {
      type: Number,
      default: 0,
    },
    maxScore: {
      type: Number,
      default: 0,
    },
    stressLevel: {
      type: String,
      enum: ["low", "moderate", "high"],
      default: "moderate",
    },
    notes: String,
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const AssessmentResponse =
  mongoose.models.AssessmentResponse ||
  mongoose.model("AssessmentResponse", assessmentResponseSchema);

export default AssessmentResponse;
