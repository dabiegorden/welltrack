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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface AIResult {
  stressLevel: "low" | "moderate" | "high";
  totalScore: number;
  maxScore: number;
  summary: string;
  recommendations: string[];
}

interface AIQuickAssessmentProps {
  onComplete?: () => void;
}

const stressLevelColor: Record<string, string> = {
  low: "bg-green-100 text-green-800",
  moderate: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

export function AIQuickAssessment({ onComplete }: AIQuickAssessmentProps) {
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error("Please describe how you've been feeling");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/assessments/ai-assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to generate assessment");
        return;
      }

      setResult({
        stressLevel: data.stressLevel,
        totalScore: data.totalScore,
        maxScore: data.maxScore,
        summary: data.summary,
        recommendations: data.recommendations || [],
      });
      toast.success("Assessment generated successfully");
      onComplete?.();
    } catch (error) {
      console.error("AI assessment error:", error);
      toast.error("Failed to generate assessment");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (result) {
    return (
      <Card className="border-green-500/20 bg-green-50/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <div>
              <CardTitle className="text-green-300">
                AI Assessment Complete
              </CardTitle>
              <CardDescription>
                Generated using Google Gemini and shared with your wellness
                counselor.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className={stressLevelColor[result.stressLevel]}>
              {result.stressLevel.charAt(0).toUpperCase() +
                result.stressLevel.slice(1)}{" "}
              Stress
            </Badge>
            <span className="text-sm text-gray-400">
              Score: {result.totalScore}/{result.maxScore}
            </span>
          </div>

          <div>
            <p className="text-sm font-medium text-white mb-1">Summary</p>
            <p className="text-sm text-gray-400">{result.summary}</p>
          </div>

          {result.recommendations.length > 0 && (
            <div>
              <p className="text-sm font-medium text-white mb-2">
                Recommendations
              </p>
              <ul className="space-y-1 list-disc list-inside text-sm text-gray-400">
                {result.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          <Button
            variant="outline"
            className="bg-transparent"
            onClick={() => {
              setResult(null);
              setDescription("");
            }}
          >
            New Check-in
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-400" />
          <CardTitle className="text-white">AI Quick Check-in</CardTitle>
        </div>
        <CardDescription>
          Describe how you've been feeling lately, in your own words. Google
          Gemini will analyze your response and generate a stress assessment
          for your counselor.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="E.g. I've been having trouble sleeping after my last shift, feeling on edge and irritable with my family..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[140px] bg-gray-800/50 border-gray-700"
        />
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Generate Assessment"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
