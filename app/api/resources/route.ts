import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/config/mongodb"
import { verifyToken } from "@/lib/auth"
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/utils/upload-handler"
import Resources from "@/lib/models/Resources"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    verifyToken(token)
    await connectDB()

    const resources = await Resources.find().sort({ createdAt: -1 })
    return NextResponse.json({ data: resources, count: resources.length })
  } catch (error) {
    console.error("Error fetching resources:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const category = formData.get("category") as string
    const type = formData.get("type") as string
    const author = formData.get("author") as string
    const tags = (formData.get("tags") as string).split(",").map((t) => t.trim())

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    const uploadResult = await uploadToCloudinary(file, "auto") as {
      secure_url: string
      public_id: string
    }

    await connectDB()

    const resource = new Resources({
      title,
      description,
      category,
      type,
      fileName: file.name,
      fileUrl: uploadResult.secure_url,
      cloudinaryId: uploadResult.public_id,
      author,
      tags,
    })
    await resource.save()

    return NextResponse.json({ data: resource }, { status: 201 })
  } catch (error) {
    console.error("Error creating resource:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const formData = await request.formData()
    const id = formData.get("id") as string
    const file = formData.get("file") as File | null
    const updates: any = {
      title: formData.get("title"),
      description: formData.get("description"),
      category: formData.get("category"),
      type: formData.get("type"),
      author: formData.get("author"),
      tags: (formData.get("tags") as string).split(",").map((t) => t.trim()),
    }

    if (file) {
      const uploadResult = await uploadToCloudinary(file, "auto") as {
        secure_url: string
        public_id: string
      }
      updates.fileName = file.name
      updates.fileUrl = uploadResult.secure_url
      updates.cloudinaryId = uploadResult.public_id
    }

    await connectDB()

    const oldResource = await Resources.findById(id)
    const resource = await Resources.findByIdAndUpdate(id, updates, {
      new: true,
    })

    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 })
    }

    if (file && oldResource?.cloudinaryId) {
      await deleteFromCloudinary(oldResource.cloudinaryId)
    }

    return NextResponse.json({ data: resource })
  } catch (error) {
    console.error("Error updating resource:", error)
    return NextResponse.json({ error: "Failed to update resource" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 })
    }

    await connectDB()

    const resource = await Resources.findByIdAndDelete(id)
    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 })
    }

    if (resource.cloudinaryId) {
      await deleteFromCloudinary(resource.cloudinaryId)
    }

    return NextResponse.json({ message: "Resource deleted successfully" })
  } catch (error) {
    console.error("Error deleting resource:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
