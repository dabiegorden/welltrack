"use client";

import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Officer {
  _id: string;
  firstname: string;
  lastname: string;
  email: string;
}

interface AIResult {
  stressLevel: "low" | "moderate" | "high";
  totalScore: number;
  maxScore: number;
  summary: string;
  recommendations: string[];
}

interface AdminAIAssessmentProps {
  onComplete?: () => void;
}

const stressLevelColor: Record<string, string> = {
  low: "bg-green-100 text-green-800",
  moderate: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

export function AdminAIAssessment({ onComplete }: AdminAIAssessmentProps) {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [officerId, setOfficerId] = useState("");
  const [description, setDescription] = useState("");
  const [isLoadingOfficers, setIsLoadingOfficers] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);

  useEffect(() => {
    const loadOfficers = async () => {
      try {
        const res = await fetch("/api/admin/users?role=officer");
        const data = await res.json();
        setOfficers(data.users || []);
      } catch (error) {
        console.error("Failed to load officers:", error);
        toast.error("Failed to load officers");
      } finally {
        setIsLoadingOfficers(false);
      }
    };

    loadOfficers();
  }, []);

  const handleSubmit = async () => {
    if (!officerId) {
      toast.error("Please select an officer");
      return;
    }

    if (!description.trim()) {
      toast.error("Please describe the officer's situation");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/assessments/ai-assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, officerId }),
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
      console.error("Admin AI assessment error:", error);
      toast.error("Failed to generate assessment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setResult(null);
    setDescription("");
    setOfficerId("");
  };

  if (result) {
    return (
      <Card className="border-green-500/20 bg-green-50/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <div>
              <CardTitle className="text-green-300">
                AI Assessment Generated
              </CardTitle>
              <CardDescription>
                Saved to the officer&apos;s assessment history.
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
            onClick={reset}
          >
            Generate Another
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
          <CardTitle className="text-white">
            Generate AI Assessment for Officer
          </CardTitle>
        </div>
        <CardDescription>
          Select an officer and describe their reported situation or
          observed behavior. Google Gemini will analyze the description and
          generate a stress assessment on their behalf.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={officerId} onValueChange={setOfficerId}>
          <SelectTrigger className="bg-gray-800/50 border-gray-700">
            <SelectValue
              placeholder={
                isLoadingOfficers ? "Loading officers..." : "Select an officer"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {officers.map((officer) => (
              <SelectItem key={officer._id} value={officer._id}>
                {officer.firstname} {officer.lastname} ({officer.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Textarea
          placeholder="E.g. The officer reported trouble sleeping after a recent shift, appears on edge and irritable, mentioned tension at home..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[140px] bg-gray-800/50 border-gray-700"
        />
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || isLoadingOfficers}
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
