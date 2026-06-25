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
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  onComplete?: () => void;
}

export function AIQuestionGenerator({ onComplete }: Props) {
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return toast.error("Please enter a prompt");
    setSubmitting(true);
    try {
      const res = await fetch("/api/assessments/templates/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, prompt, count }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      toast.success(data.message);
      setName("");
      setPrompt("");
      setCount(5);
      onComplete?.();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-400" />
          <CardTitle className="text-white">
            Generate Assessment Questions with AI
          </CardTitle>
        </div>
        <CardDescription>
          Describe the assessment and choose how many questions. The AI will
          create scored questions and save them as an assessment officers can
          take and submit.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-sm text-gray-300">
              Assessment Name (optional)
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Operational Stress Check"
              className="bg-gray-950 border-gray-800 text-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-300">Number of Questions</label>
            <Input
              type="number"
              min={1}
              max={30}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="bg-gray-950 border-gray-800 text-white"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm text-gray-300">Prompt</label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g. Generate questions assessing burnout, sleep, workload pressure and peer support among frontline officers..."
            className="min-h-[120px] bg-gray-950 border-gray-800 text-white"
          />
        </div>
        <Button
          onClick={handleGenerate}
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate & Save Assessment"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
