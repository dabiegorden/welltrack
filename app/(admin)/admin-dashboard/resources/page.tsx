"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Edit2,
  Trash2,
  FileText,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Resource {
  _id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  fileName: string;
  fileUrl: string;
  author?: string;
  tags?: string[];
  createdAt: string;
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    type: "document",
    author: "",
    tags: "",
    file: null as File | null,
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/resources");
      const result = await response.json();
      setResources(result.data || []);
    } catch (error) {
      toast.error("Failed to fetch resources");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("category", formData.category);
      data.append("type", formData.type);
      data.append("author", formData.author);
      data.append("tags", formData.tags);
      if (formData.file) {
        data.append("file", formData.file);
      }
      if (editingId) {
        data.append("id", editingId);
      }

      const response = await fetch("/api/resources", {
        method: editingId ? "PUT" : "POST",
        body: data,
      });

      if (!response.ok) throw new Error("Failed to save");

      toast.success(
        editingId
          ? "Resource updated successfully"
          : "Resource created successfully"
      );
      setOpen(false);
      setFormData({
        title: "",
        description: "",
        category: "",
        type: "document",
        author: "",
        tags: "",
        file: null,
      });
      setEditingId(null);
      fetchResources();
    } catch (error) {
      toast.error("Failed to save resource");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await fetch(`/api/resources?id=${id}`, { method: "DELETE" });
      toast.success("Resource deleted successfully");
      fetchResources();
    } catch (error) {
      toast.error("Failed to delete resource");
    }
  };

  const handleEdit = (resource: Resource) => {
    setEditingId(resource._id);
    setFormData({
      title: resource.title,
      description: resource.description,
      category: resource.category,
      type: resource.type,
      author: resource.author || "",
      tags: resource.tags?.join(", ") || "",
      file: null,
    });
    setOpen(true);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setEditingId(null);
      setFormData({
        title: "",
        description: "",
        category: "",
        type: "document",
        author: "",
        tags: "",
        file: null,
      });
    }
  };

  const getDownloadUrl = (fileUrl: string, fileName: string) => {
    if (!fileUrl) return fileUrl;
    // For documents, add fl_attachment to force download
    if (fileName.match(/\.(pdf|doc|docx|xlsx|xls|ppt|pptx|txt)$/i)) {
      return fileUrl.replace("/upload/", "/upload/fl_attachment/");
    }
    return fileUrl;
  };

  return (
    <div className="space-y-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">
          Wellness Resources
        </h1>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Resource
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Resource" : "Add Resource"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <Input
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <Input
                  required
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Category
                  </label>
                  <Input
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    placeholder="e.g., Mental Health"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <Input
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    placeholder="e.g., PDF, Guide"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">File</label>
                <Input
                  type="file"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      file: e.target.files?.[0] || null,
                    })
                  }
                  accept=".pdf,.doc,.docx,.txt,.jpg,.png"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Accepted: PDF, DOC, TXT, JPG, PNG
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Author</label>
                <Input
                  value={formData.author}
                  onChange={(e) =>
                    setFormData({ ...formData, author: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tags (comma separated)
                </label>
                <Input
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  placeholder="wellness, mindfulness"
                />
              </div>
              <Button type="submit" className="w-full">
                {editingId ? "Update" : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-muted-foreground col-span-full">Loading...</p>
        ) : resources.length === 0 ? (
          <p className="text-muted-foreground col-span-full">
            No resources found
          </p>
        ) : (
          resources.map((resource) => (
            <Card key={resource._id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    <FileText className="h-5 w-5 text-blue-600 mt-1 shrink-0" />
                    <div>
                      <CardTitle className="line-clamp-2 text-base">
                        {resource.title}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-2">
                        {resource.category}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(resource)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(resource._id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {resource.description}
                </p>
                <div className="flex flex-wrap gap-1 mb-3">
                  <Badge variant="outline">{resource.type}</Badge>
                  {resource.tags &&
                    resource.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                </div>
                {resource.author && (
                  <p className="text-xs text-muted-foreground mb-3">
                    By {resource.author}
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-auto gap-2 bg-transparent"
                  asChild
                >
                  <a
                    href={getDownloadUrl(resource.fileUrl, resource.fileName)}
                    download={resource.fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download
                    <Download className="h-3 w-3" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
