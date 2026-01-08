import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    type: { type: String, required: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    cloudinaryId: { type: String }, // Store Cloudinary public_id for deletion
    author: { type: String },
    tags: [String],
  },
  { timestamps: true }
);

const Resources =
  mongoose.models.Resources || mongoose.model("Resources", resourceSchema);

export default Resources;
