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
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { STRESS_MANAGEMENT_TIPS } from "@/constants/stress-tips";

interface AnswerOption {
  label: string;
  points: number;
}

interface Question {
  _id: string;
  text: string;
  category?: string;
  options?: AnswerOption[];
  isActive?: boolean;
}

interface AssessmentIntakeProps {
  templateId: string;
  templateName: string;
  questions: Question[];
  onComplete?: (result?: any) => void;
}

const DEFAULT_OPTIONS: AnswerOption[] = [
  { label: "Never", points: 1 },
  { label: "Sometimes", points: 2 },
  { label: "Often", points: 3 },
  { label: "Always", points: 4 },
];

const optionsFor = (q: Question): AnswerOption[] =>
  q.options && q.options.length ? q.options : DEFAULT_OPTIONS;

export function OfficerAssessmentIntake({
  templateId,
  templateName,
  questions,
  onComplete,
}: AssessmentIntakeProps) {
  // Only present active questions to officers
  const activeQuestions = questions.filter((q) => q.isActive !== false);

  const [responses, setResponses] = useState<Record<string, number | null>>(
    activeQuestions.reduce((acc, q) => ({ ...acc, [q._id]: null }), {})
  );
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleScoreChange = (questionId: string, points: number) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: points,
    }));
  };

  const handleSubmit = async () => {
    const unanswered = activeQuestions.some(
      (q) => responses[q._id] === null || responses[q._id] === undefined
    );
    if (unanswered) {
      toast.error("Please answer all questions before submitting");
      return;
    }

    setIsSubmitting(true);

    try {
      const submissionData = {
        templateId,
        responses: activeQuestions.map((q) => ({
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

      onComplete?.(data);
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
                  Your responses have been recorded and will be reviewed by a
                  wellness counselor.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-400">
              Thank you for taking the time to complete this assessment. Your
              results are confidential and shared only with our wellness
              counselors, who may reach out to offer support.
            </p>

            <div className="flex gap-3">
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={() =>
                  (window.location.href = "/admin-dashboard/counseling")
                }
              >
                Book a Counselor
              </Button>
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

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Manage Your Stress</CardTitle>
            <CardDescription>
              A few tips that may help while you wait to hear from a
              counselor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {STRESS_MANAGEMENT_TIPS.map((tip) => (
              <div key={tip.title}>
                <p className="font-medium text-white">{tip.title}</p>
                <p className="text-sm text-gray-400">{tip.description}</p>
              </div>
            ))}
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
            confidential. Select the option that best applies to you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {activeQuestions.map((question, index) => (
            <div key={question._id} className="space-y-3">
              <div className="flex items-start justify-between">
                <label className="text-base font-medium text-white">
                  {index + 1}. {question.text}
                </label>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {optionsFor(question).map((opt) => {
                  const selected = responses[question._id] === opt.points;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() =>
                        handleScoreChange(question._id, opt.points)
                      }
                      className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition ${
                        selected
                          ? "border-blue-500 bg-blue-500/10 text-white"
                          : "border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600"
                      }`}
                    >
                      <span>{opt.label}</span>
                      <span className="text-xs text-gray-500">
                        {opt.points} pt
                      </span>
                    </button>
                  );
                })}
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
