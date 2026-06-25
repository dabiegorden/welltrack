import mongoose, { Schema, type Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  email: string;
  password: string;
  firstname: string;
  lastname: string;
  role: "admin" | "officer" | "counselor";
  phone: string;
  address: string;
  serviceNumber?: string;
  rank?: string;
  unit?: string;
  department?: string;
  contact?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    firstname: {
      type: String,
      required: true,
    },
    lastname: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "officer", "counselor"],
      default: "officer",
    },
    phone: { type: String },
    address: { type: String },
    // Police service details (used for admins and officers)
    serviceNumber: {
      type: String,
      unique: true,
      sparse: true, // allows multiple docs without a service number
      trim: true,
    },
    rank: { type: String, trim: true },
    unit: { type: String, trim: true },
    department: { type: String, trim: true },
    contact: { type: String, trim: true },
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
