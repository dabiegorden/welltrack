"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

const CATEGORIES = ["workload", "support", "wellbeing", "environment"] as const;

const DEFAULT_OPTIONS = [
  { label: "Never", points: 1 },
  { label: "Sometimes", points: 2 },
  { label: "Often", points: 3 },
  { label: "Always", points: 4 },
];

type AnswerOption = { label: string; points: number };
type Question = {
  text: string;
  category: (typeof CATEGORIES)[number];
  isActive: boolean;
  options: AnswerOption[];
};

function blankQuestion(): Question {
  return {
    text: "",
    category: "workload",
    isActive: true,
    options: DEFAULT_OPTIONS.map((o) => ({ ...o })),
  };
}

export default function ManageAssessmentsPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([blankQuestion()]);

  const router = useRouter();

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/assessments/templates");
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch {
      toast.error("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const profileRes = await fetch("/api/auth/profile");
      const profileData = await profileRes.json();
      if (!profileData.user || profileData.user.role !== "admin") {
        router.push("/sign-in");
        return;
      }
      fetchTemplates();
    })();
  }, [router]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setQuestions([blankQuestion()]);
    setDialogOpen(true);
  };

  const openEdit = (t: any) => {
    setEditing(t);
    setName(t.name || "");
    setDescription(t.description || "");
    setQuestions(
      (t.questions || []).map((q: any) => ({
        text: q.text || "",
        category: q.category || "workload",
        isActive: q.isActive !== false,
        options:
          q.options && q.options.length
            ? q.options.map((o: any) => ({ label: o.label, points: o.points }))
            : DEFAULT_OPTIONS.map((o) => ({ ...o })),
      }))
    );
    setDialogOpen(true);
  };

  const updateQuestion = (i: number, patch: Partial<Question>) => {
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === i ? { ...q, ...patch } : q))
    );
  };

  const updateOption = (qi: number, oi: number, patch: Partial<AnswerOption>) => {
    setQuestions((prev) =>
      prev.map((q, idx) =>
        idx === qi
          ? {
              ...q,
              options: q.options.map((o, j) =>
                j === oi ? { ...o, ...patch } : o
              ),
            }
          : q
      )
    );
  };

  const handleSave = async () => {
    if (!name.trim()) return toast.error("Template name is required");
    const cleaned = questions
      .filter((q) => q.text.trim())
      .map((q) => ({
        ...q,
        options: q.options.filter((o) => o.label.trim()),
      }));
    if (cleaned.length === 0)
      return toast.error("Add at least one question with text");

    setSaving(true);
    try {
      const url = editing
        ? `/api/assessments/templates/${editing._id}`
        : "/api/assessments/templates";
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, questions: cleaned }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast.success(editing ? "Template updated" : "Template created");
      setDialogOpen(false);
      fetchTemplates();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this assessment template?")) return;
    try {
      const res = await fetch(`/api/assessments/templates/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      toast.success("Template deleted");
      fetchTemplates();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const toggleActive = async (t: any) => {
    // Toggle every question's active flag (activate/deactivate the whole template)
    const allActive = (t.questions || []).every(
      (q: any) => q.isActive !== false
    );
    const updated = (t.questions || []).map((q: any) => ({
      text: q.text,
      category: q.category,
      isActive: !allActive,
      options: q.options,
    }));
    try {
      const res = await fetch(`/api/assessments/templates/${t._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: t.name,
          description: t.description,
          questions: updated,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(allActive ? "Questions deactivated" : "Questions activated");
      fetchTemplates();
    } catch {
      toast.error("Failed to update status");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Assessment Templates</h1>
          <p className="text-gray-400">
            Create and manage scored stress assessment questions for officers
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      <div className="grid gap-4">
        {templates.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-6 text-center">
              <p className="text-gray-400">
                No assessment templates yet. Create one to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          templates.map((template) => {
            const activeCount = (template.questions || []).filter(
              (q: any) => q.isActive !== false
            ).length;
            return (
              <Card
                key={template._id}
                className="bg-gray-900 border-gray-800"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-white">{template.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-400">
                    {template.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                      {template.questions?.length || 0} questions
                    </span>
                    <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded">
                      {activeCount} active
                    </span>
                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                      Max Score: {template.maxScore || 0}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(template)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActive(template)}
                    >
                      {activeCount > 0 ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(template._id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-950 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Template" : "New Assessment Template"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Define questions and scored answer options. Total score determines
              the stress level (Low / Moderate / High).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Template Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Monthly Stress Check"
                className="bg-gray-900 border-gray-800"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-gray-900 border-gray-800"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Questions</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setQuestions((p) => [...p, blankQuestion()])
                  }
                >
                  <Plus className="mr-1 h-3 w-3" /> Add Question
                </Button>
              </div>

              {questions.map((q, qi) => (
                <div
                  key={qi}
                  className="rounded-lg border border-gray-800 bg-gray-900/50 p-4 space-y-3"
                >
                  <div className="flex items-start gap-2">
                    <Textarea
                      value={q.text}
                      onChange={(e) =>
                        updateQuestion(qi, { text: e.target.value })
                      }
                      placeholder="e.g. How often do you feel overwhelmed at work?"
                      className="bg-gray-950 border-gray-800"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-400 shrink-0"
                      onClick={() =>
                        setQuestions((p) => p.filter((_, i) => i !== qi))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Select
                      value={q.category}
                      onValueChange={(v) =>
                        updateQuestion(qi, { category: v as any })
                      }
                    >
                      <SelectTrigger className="w-44 bg-gray-950 border-gray-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-950 border-gray-800 text-white">
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <label className="flex items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={q.isActive}
                        onChange={(e) =>
                          updateQuestion(qi, { isActive: e.target.checked })
                        }
                      />
                      Active
                    </label>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Answer Options (label + points)
                    </p>
                    {q.options.map((o, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <Input
                          value={o.label}
                          onChange={(e) =>
                            updateOption(qi, oi, { label: e.target.value })
                          }
                          placeholder="Label"
                          className="bg-gray-950 border-gray-800"
                        />
                        <Input
                          type="number"
                          value={o.points}
                          onChange={(e) =>
                            updateOption(qi, oi, {
                              points: Number(e.target.value),
                            })
                          }
                          className="w-24 bg-gray-950 border-gray-800"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 shrink-0"
                          onClick={() =>
                            updateQuestion(qi, {
                              options: q.options.filter((_, j) => j !== oi),
                            })
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateQuestion(qi, {
                          options: [...q.options, { label: "", points: 0 }],
                        })
                      }
                    >
                      <Plus className="mr-1 h-3 w-3" /> Add Option
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? <Spinner className="mr-2 h-4 w-4" /> : null}
              {editing ? "Update Template" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
