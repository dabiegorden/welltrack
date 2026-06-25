import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IDepartment extends Document {
  name: string;
  code?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: { type: String, trim: true },
    description: { type: String, trim: true },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Default Sefwi-Wiawso divisional departments
export const DEFAULT_DEPARTMENTS = [
  "CID",
  "DOVVSU",
  "Communication",
  "Arms",
  "Store",
  "JUPOL",
  "Operations",
  "Orderly Room",
  "Finance",
];

const Department: Model<IDepartment> =
  mongoose.models.Department ||
  mongoose.model<IDepartment>("Department", DepartmentSchema);

export default Department;
