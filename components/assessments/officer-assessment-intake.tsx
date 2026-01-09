"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Question {
  _id: string;
  text: string;
  category?: string;
}

interface AssessmentIntakeProps {
  templateId: string;
  templateName: string;
  questions: Question[];
  onComplete?: (result: "low" | "moderate" | "high") => void;
}

export function OfficerAssessmentIntake({
  templateId,
  templateName,
  questions,
  onComplete,
}: AssessmentIntakeProps) {
  const [responses, setResponses] = useState<Record<string, number>>(
    questions.reduce((acc, q) => ({ ...acc, [q._id]: 0 }), {})
  );
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleScoreChange = (questionId: string, value: string) => {
    const score = Math.min(4, Math.max(0, Number.parseInt(value) || 0));
    setResponses((prev) => ({
      ...prev,
      [questionId]: score,
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const submissionData = {
        templateId,
        responses: questions.map((q) => ({
          questionId: q._id,
          questionText: q.text,
          score: responses[q._id] || 0,
        })),
        notes,
      };

      const response = await fetch("/api/assessments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to submit assessment");
        return;
      }

      setResult(data);
      setSubmitted(true);
      toast.success("Assessment submitted successfully");

      // ✅ THIS IS THE LINE YOU WERE ASKING ABOUT
      onComplete?.(data.stressLevel);
    } catch (error) {
      console.error("[v0] Assessment submission error:", error);
      toast.error("Failed to submit assessment");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted && result) {
    return (
      <div className="space-y-6">
        <Card className="border-green-500/20 bg-green-50/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <div>
                <CardTitle className="text-green-300">
                  Assessment Completed
                </CardTitle>
                <CardDescription>
                  Your responses have been recorded
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Total Score</p>
                <p className="text-2xl font-bold text-white">
                  {result.totalScore}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Stress Level</p>
                <p className="text-2xl font-bold capitalize text-yellow-400">
                  {result.stressLevel}
                </p>
              </div>
            </div>

            {result.stressLevel === "high" && (
              <Alert className="border-red-500/30 bg-red-50/5">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-300">
                  Your assessment indicates high stress levels. We recommend
                  booking a counseling session with a professional who can
                  provide personalized support.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              {result.stressLevel === "high" && (
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={() =>
                    (window.location.href = "/admin-dashboard/counseling")
                  }
                >
                  Book a Counselor
                </Button>
              )}
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => (window.location.href = "/admin-dashboard")}
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">{templateName}</CardTitle>
          <CardDescription>
            Please answer the following questions honestly. Your responses are
            confidential. Enter a value from 0-4 for each question.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {questions.map((question, index) => (
            <div key={question._id} className="space-y-3">
              <div className="flex items-start justify-between">
                <label className="text-base font-medium text-white">
                  {index + 1}. {question.text}
                </label>
              </div>

              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min="0"
                  max="4"
                  value={responses[question._id] || 0}
                  onChange={(e) =>
                    handleScoreChange(question._id, e.target.value)
                  }
                  placeholder="0-4"
                  className="w-24 bg-gray-800/50 border-gray-700"
                />
                <span className="text-sm text-gray-400">
                  {responses[question._id] === 0 && "Not at all"}
                  {responses[question._id] === 1 && "Slightly"}
                  {responses[question._id] === 2 && "Moderately"}
                  {responses[question._id] === 3 && "Considerably"}
                  {responses[question._id] === 4 && "Severely"}
                </span>
              </div>

              <div className="text-xs text-gray-500">
                Valid range: 0 (Not at all) - 4 (Severely)
              </div>
            </div>
          ))}

          <div className="space-y-3 border-t border-gray-800 pt-6">
            <label className="text-base font-medium text-white">
              Additional Notes (Optional)
            </label>
            <Textarea
              placeholder="Any additional information you'd like to share with your counselor..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-gray-800/50 border-gray-700"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Assessment"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
