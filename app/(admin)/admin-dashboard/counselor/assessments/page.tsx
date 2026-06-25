"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, Sparkles, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { AIQuestionGenerator } from "@/components/assessments/ai-question-generator";

interface Assessment {
  _id: string;
  officerId: {
    firstname: string;
    lastname: string;
    email: string;
  } | null;
  templateId: {
    name: string;
  } | null;
  totalScore: number;
  maxScore: number;
  stressLevel: "low" | "moderate" | "high";
  notes?: string;
  responses: Array<{ questionText: string; score: number }>;
  completedAt: string;
  createdAt: string;
  source?: "form" | "ai-chat";
  inputText?: string;
  aiAnalysis?: {
    summary?: string;
    riskLevel?: "low" | "moderate" | "high";
    recommendations?: string[];
  };
}

export default function CounselorAssessmentsPage() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Assessment | null>(null);
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      const profileRes = await fetch("/api/auth/profile");
      const profileData = await profileRes.json();

      if (
        !profileData.user ||
        !["counselor", "admin"].includes(profileData.user.role)
      ) {
        router.push("/admin-dashboard");
        return;
      }

      const res = await fetch("/api/assessments");
      const data = await res.json();
      setAssessments(data.data || []);
    } catch (error) {
      console.error("Error fetching assessments:", error);
      toast.error("Failed to load assessments");
    } finally {
      setLoading(false);
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

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Officer Assessments</h1>
          <p className="text-gray-400">
            Confidential stress assessment results submitted by officers
          </p>
        </div>

        <Button
          onClick={() => setShowAIGenerator((prev) => !prev)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {showAIGenerator ? (
            <>
              <X className="h-4 w-4 mr-2" />
              Close
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Generate Assessment Questions
            </>
          )}
        </Button>
      </div>

      {showAIGenerator && (
        <AIQuestionGenerator
          onComplete={() => {
            setShowAIGenerator(false);
            init();
          }}
        />
      )}

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">
            Submitted Assessments ({assessments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assessments.length === 0 ? (
            <p className="text-gray-400">No assessments submitted yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800">
                    <TableHead className="text-gray-400">Officer</TableHead>
                    <TableHead className="text-gray-400">Template</TableHead>
                    <TableHead className="text-gray-400">Score</TableHead>
                    <TableHead className="text-gray-400">
                      Stress Level
                    </TableHead>
                    <TableHead className="text-gray-400">Submitted</TableHead>
                    <TableHead className="text-right text-gray-400">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessments.map((assessment) => (
                    <TableRow key={assessment._id} className="border-gray-800">
                      <TableCell className="text-white font-medium">
                        {assessment.officerId
                          ? `${assessment.officerId.firstname} ${assessment.officerId.lastname}`
                          : "Unknown"}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {assessment.source === "ai-chat" ? (
                          <Badge className="bg-blue-100 text-blue-800">
                            <Sparkles className="h-3 w-3 mr-1" />
                            AI Check-in
                          </Badge>
                        ) : (
                          assessment.templateId?.name || "—"
                        )}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {assessment.totalScore}
                        {assessment.maxScore ? ` / ${assessment.maxScore}` : ""}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStressColor(assessment.stressLevel)}>
                          {assessment.stressLevel.charAt(0).toUpperCase() +
                            assessment.stressLevel.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm">
                        {formatDate(assessment.completedAt || assessment.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelected(assessment)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selected?.officerId
                ? `${selected.officerId.firstname} ${selected.officerId.lastname}`
                : "Assessment Details"}
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selected.officerId?.email || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Score</p>
                  <p className="text-lg font-bold">
                    {selected.totalScore}
                    {selected.maxScore ? ` / ${selected.maxScore}` : ""}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stress Level</p>
                  <Badge className={getStressColor(selected.stressLevel)}>
                    {selected.stressLevel}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed At</p>
                  <p>{formatDate(selected.completedAt || selected.createdAt)}</p>
                </div>
              </div>

              {selected.aiAnalysis?.summary && (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-blue-500" />
                    <p className="font-semibold">AI Analysis</p>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {selected.aiAnalysis.summary}
                  </p>
                  {selected.aiAnalysis.recommendations &&
                    selected.aiAnalysis.recommendations.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1">
                          Recommendations
                        </p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          {selected.aiAnalysis.recommendations.map(
                            (rec, i) => (
                              <li key={i}>{rec}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                </div>
              )}

              {selected.inputText && (
                <div className="border-t pt-4">
                  <p className="font-semibold mb-2">Officer's Description</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selected.inputText}
                  </p>
                </div>
              )}

              {selected.notes && (
                <div className="border-t pt-4">
                  <p className="font-semibold mb-2">Officer Notes</p>
                  <p className="text-sm text-muted-foreground">{selected.notes}</p>
                </div>
              )}

              {selected.responses && selected.responses.length > 0 && (
                <div className="border-t pt-4">
                  <p className="font-semibold mb-3">Responses</p>
                  <div className="space-y-3">
                    {selected.responses.map((response, i) => (
                      <div key={i} className="border rounded-lg p-3 bg-muted/50">
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
