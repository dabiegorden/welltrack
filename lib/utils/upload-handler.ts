import cloudinary from "../cloudinary";

export async function uploadToCloudinary(
  file: File,
  resourceType: "auto" | "image" | "video" | "raw" = "auto"
) {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          folder: "welltrack/resources",
          use_filename: true,
          unique_filename: true,
        },
        (error: any, result: any) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(buffer);
    });
  } catch (error) {
    throw new Error(`Upload failed: ${error}`);
  }
}

export async function deleteFromCloudinary(publicId: string) {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Failed to delete file from Cloudinary:", error);
  }
}
