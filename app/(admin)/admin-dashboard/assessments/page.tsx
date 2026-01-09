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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Trash2,
  Eye,
  Edit2,
  X,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Assessment {
  _id: string;
  officerId: any;
  totalScore: number;
  stressLevel: "low" | "moderate" | "high";
  responses: Array<{ questionId: string; questionText: string; score: number }>;
  completedAt: string;
  createdAt: string;
  templateId: any;
}

interface Template {
  _id: string;
  name: string;
  description: string;
  questions: Array<{ text: string; category?: string }>;
  maxScore?: number;
}

interface User {
  _id: string;
  name: string;
  role: string;
}

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [selectedAssessment, setSelectedAssessment] =
    useState<Assessment | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    questions: [{ text: "", category: "wellbeing" }],
  });

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchAssessments();
      fetchTemplates();
    }
  }, [user]);

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/profile");
      const result = await response.json();
      setUser(result.user);

      if (result.user?.role === "officer") {
        window.location.href = "/admin-dashboard/assessments/intake";
      } else if (result.user?.role === "counselor") {
        window.location.href = "/admin-dashboard";
      }
    } catch (error) {
      console.error("[v0] Failed to fetch user:", error);
      toast.error("Failed to load user info");
    } finally {
      setLoading(false);
    }
  };

  const fetchAssessments = async () => {
    try {
      const response = await fetch("/api/assessments");
      const result = await response.json();
      setAssessments(result.data || []);
    } catch (error) {
      console.error("[v0] Error fetching assessments:", error);
      toast.error("Failed to fetch assessments");
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/assessments/templates");
      const result = await response.json();
      setTemplates(result.templates || result.data || []);
    } catch (error) {
      console.error("[v0] Error fetching templates:", error);
      toast.error("Failed to fetch templates");
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const validQuestions = templateForm.questions.filter((q) =>
        q.text.trim()
      );

      if (!templateForm.name.trim() || validQuestions.length === 0) {
        toast.error("Template name and at least one question are required");
        setIsSubmitting(false);
        return;
      }

      const method = editingTemplate ? "PUT" : "POST";
      const url = editingTemplate
        ? `/api/assessments/templates/${editingTemplate._id}`
        : "/api/assessments/templates";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateForm.name,
          description: templateForm.description,
          questions: validQuestions,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error ||
            `Failed to ${editingTemplate ? "update" : "create"} template`
        );
      }

      toast.success(
        editingTemplate
          ? "Template updated successfully"
          : "Template created successfully"
      );
      setShowTemplateForm(false);
      setEditingTemplate(null);
      setTemplateForm({
        name: "",
        description: "",
        questions: [{ text: "", category: "wellbeing" }],
      });
      fetchTemplates();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save template"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      description: template.description,
      questions: template.questions.map((q) => ({
        text: q.text,
        category: q.category || "wellbeing",
      })),
    });
    setShowTemplateForm(true);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const response = await fetch(`/api/assessments/templates/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete template");

      toast.success("Template deleted successfully");
      fetchTemplates();
    } catch (error) {
      console.error("[v0] Error deleting template:", error);
      toast.error("Failed to delete template");
    }
  };

  const handleRemoveQuestion = (index: number) => {
    const newQuestions = templateForm.questions.filter((_, i) => i !== index);
    if (newQuestions.length === 0) {
      setTemplateForm({
        ...templateForm,
        questions: [{ text: "", category: "wellbeing" }],
      });
    } else {
      setTemplateForm({ ...templateForm, questions: newQuestions });
    }
  };

  const handleDeleteAssessment = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      const response = await fetch(`/api/assessments?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      toast.success("Assessment deleted");
      fetchAssessments();
    } catch (error) {
      console.error("[v0] Error deleting assessment:", error);
      toast.error("Failed to delete assessment");
    }
  };

  const getStressColor = (level: string) => {
    switch (level) {
      case "low":
        return "bg-green-100 text-green-800";
      case "moderate":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="space-y-6 py-12">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Assessment Management
          </h1>
          <p className="text-muted-foreground">
            Manage templates and view submitted assessments
          </p>
        </div>
        <div className="flex gap-2 items-start">
          <Dialog open={showTemplateForm} onOpenChange={setShowTemplateForm}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate
                    ? "Edit Assessment Template"
                    : "Create Assessment Template"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSaveTemplate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Template Name
                  </label>
                  <Input
                    required
                    value={templateForm.name}
                    onChange={(e) =>
                      setTemplateForm({ ...templateForm, name: e.target.value })
                    }
                    placeholder="e.g., Stress Assessment"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <Input
                    value={templateForm.description}
                    onChange={(e) =>
                      setTemplateForm({
                        ...templateForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Template description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Questions
                  </label>
                  {templateForm.questions.map((q, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <Input
                        value={q.text}
                        onChange={(e) => {
                          const newQ = [...templateForm.questions];
                          newQ[i] = { ...newQ[i], text: e.target.value };
                          setTemplateForm({
                            ...templateForm,
                            questions: newQ,
                          });
                        }}
                        placeholder={`Question ${i + 1}`}
                      />
                      {templateForm.questions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveQuestion(i)}
                          className="text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setTemplateForm({
                        ...templateForm,
                        questions: [
                          ...templateForm.questions,
                          { text: "", category: "wellbeing" },
                        ],
                      })
                    }
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingTemplate
                      ? "Update Template"
                      : "Create Template"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assessment Templates ({templates.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {templates.length === 0 ? (
              <p className="text-muted-foreground">No templates created</p>
            ) : (
              <div className="space-y-3">
                {templates.map((template) => (
                  <div
                    key={template._id}
                    className="border rounded-lg p-3 flex justify-between items-start"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{template.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {template.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {template.questions.length} questions
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleDeleteTemplate(template._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Submitted Assessments ({assessments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {assessments.length === 0 ? (
              <p className="text-muted-foreground">
                No assessments submitted yet
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Officer</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Stress Level</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assessments.slice(0, 5).map((assessment) => (
                      <TableRow key={assessment._id}>
                        <TableCell className="font-medium text-sm">
                          {assessment.officerId?.firstname || "Unknown"}{" "}
                          {assessment.officerId?.lastname || ""}
                        </TableCell>
                        <TableCell className="font-medium">
                          {assessment.totalScore}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={getStressColor(assessment.stressLevel)}
                          >
                            {assessment.stressLevel.charAt(0).toUpperCase() +
                              assessment.stressLevel.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  setSelectedAssessment(assessment)
                                }
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleDeleteAssessment(assessment._id)
                                }
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedAssessment && (
        <Card>
          <CardHeader>
            <CardTitle>
              Assessment Details - {selectedAssessment.officerId?.firstname}{" "}
              {selectedAssessment.officerId?.lastname}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Officer</p>
                  <p className="font-medium">
                    {selectedAssessment.officerId?.firstname}{" "}
                    {selectedAssessment.officerId?.lastname}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Score</p>
                  <p className="text-lg font-bold">
                    {selectedAssessment.totalScore}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stress Level</p>
                  <Badge
                    className={getStressColor(selectedAssessment.stressLevel)}
                  >
                    {selectedAssessment.stressLevel}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed At</p>
                  <p>
                    {new Date(
                      selectedAssessment.completedAt ||
                        selectedAssessment.createdAt
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
              {selectedAssessment.responses &&
                selectedAssessment.responses.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="font-semibold mb-3">Responses</p>
                    <div className="space-y-3">
                      {selectedAssessment.responses.map((response, i) => (
                        <div
                          key={i}
                          className="border rounded-lg p-3 bg-muted/50"
                        >
                          <p className="font-medium text-sm">
                            {response.questionText}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Score: {response.score}/4
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
