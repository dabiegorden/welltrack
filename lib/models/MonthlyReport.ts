import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IMonthlyReport extends Document {
  month: number; // 1-12
  year: number;
  title: string;
  generatedBy: mongoose.Types.ObjectId;
  assessmentStats: {
    totalAssessed: number;
    lowStress: number;
    moderateStress: number;
    highStress: number;
  };
  counselingStats: {
    sessionsCompleted: number;
    pendingSessions: number;
    activeCounselors: number;
  };
  departmentStats: {
    department: string;
    totalOfficers: number;
    lowStress: number;
    moderateStress: number;
    highStress: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const MonthlyReportSchema = new Schema<IMonthlyReport>(
  {
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    title: { type: String, required: true },
    generatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assessmentStats: {
      totalAssessed: { type: Number, default: 0 },
      lowStress: { type: Number, default: 0 },
      moderateStress: { type: Number, default: 0 },
      highStress: { type: Number, default: 0 },
    },
    counselingStats: {
      sessionsCompleted: { type: Number, default: 0 },
      pendingSessions: { type: Number, default: 0 },
      activeCounselors: { type: Number, default: 0 },
    },
    departmentStats: [
      {
        _id: false,
        department: String,
        totalOfficers: { type: Number, default: 0 },
        lowStress: { type: Number, default: 0 },
        moderateStress: { type: Number, default: 0 },
        highStress: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

MonthlyReportSchema.index({ month: 1, year: 1 }, { unique: true });

const MonthlyReport: Model<IMonthlyReport> =
  mongoose.models.MonthlyReport ||
  mongoose.model<IMonthlyReport>("MonthlyReport", MonthlyReportSchema);

export default MonthlyReport;
