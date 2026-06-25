"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OfficerAssessmentIntake } from "@/components/assessments/officer-assessment-intake";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { STRESS_MANAGEMENT_TIPS } from "@/constants/stress-tips";

export default function AssessmentIntakePage() {
  const [user, setUser] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  /* ---------------- Auth & Templates ---------------- */
  useEffect(() => {
    const init = async () => {
      try {
        const profileRes = await fetch("/api/auth/profile");
        const profileData = await profileRes.json();

        if (!profileData.user || profileData.user.role !== "officer") {
          router.push("/sign-in");
          return;
        }

        setUser(profileData.user);

        const templatesRes = await fetch("/api/assessments/templates");
        const templatesData = await templatesRes.json();
        setTemplates(templatesData.templates || []);
      } catch (error) {
        console.error("Assessment load error:", error);
        toast.error("Failed to load assessments");
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [router]);

  /* ---------------- Assessment Complete ---------------- */
  const handleAssessmentComplete = (data?: any) => {
    setResult(data || null);
    setSubmitted(true);
    toast.success("Assessment submitted successfully");
  };

  /* ---------------- Loading ---------------- */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  /* ---------------- Result Screen ---------------- */
  if (submitted) {
    const level: "low" | "moderate" | "high" = result?.stressLevel || "low";
    const needsCounseling = level === "moderate" || level === "high";
    const levelStyles: Record<string, string> = {
      low: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
      moderate: "text-amber-400 border-amber-500/30 bg-amber-500/10",
      high: "text-red-400 border-red-500/30 bg-red-500/10",
    };
    const levelLabel: Record<string, string> = {
      low: "Low Stress",
      moderate: "Moderate Stress",
      high: "High Stress",
    };

    return (
      <div className="flex items-center justify-center min-h-[70vh] py-8">
        <Card className="max-w-md w-full bg-gray-900 border-gray-800">
          <CardHeader className="text-center">
            <CardTitle className="text-white">Your Assessment Result</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 text-center">
            <div
              className={`rounded-xl border p-6 ${levelStyles[level]}`}
            >
              <p className="text-sm uppercase tracking-wide opacity-80">
                Stress Level
              </p>
              <p className="text-3xl font-bold mt-1">{levelLabel[level]}</p>
              {typeof result?.totalScore === "number" && (
                <p className="text-sm mt-2 opacity-80">
                  Score: {result.totalScore}
                </p>
              )}
            </div>

            {needsCounseling ? (
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-left">
                <p className="text-sm text-red-200">
                  Your assessment result indicates that you may benefit from a
                  counseling session. Please book an appointment with a
                  counselor.
                </p>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">
                Your stress levels appear to be within a healthy range. Keep up
                your wellness practices.
              </p>
            )}

            <div className="space-y-3 text-left">
              <p className="text-sm font-semibold text-white text-center">
                Manage Your Stress
              </p>
              {STRESS_MANAGEMENT_TIPS.slice(0, 3).map((tip) => (
                <div key={tip.title}>
                  <p className="font-medium text-white text-sm">{tip.title}</p>
                  <p className="text-xs text-gray-400">{tip.description}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              {needsCounseling && (
                <Button
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => router.push("/admin-dashboard/counseling")}
                >
                  Book a Counselor
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() =>
                  router.push("/admin-dashboard/assessments/history")
                }
              >
                View My Assessment History
              </Button>

              <Button
                variant="ghost"
                onClick={() => {
                  setSubmitted(false);
                  setResult(null);
                  setSelectedTemplate(null);
                }}
                className="text-gray-400"
              >
                Take Another Assessment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ---------------- Intake Screen ---------------- */
  if (selectedTemplate) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => setSelectedTemplate(null)}
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Templates
        </Button>

        <OfficerAssessmentIntake
          templateId={selectedTemplate._id}
          templateName={selectedTemplate.name}
          questions={selectedTemplate.questions || []}
          onComplete={handleAssessmentComplete}
        />
      </div>
    );
  }

  /* ---------------- Template List ---------------- */
  return (
    <div className="space-y-6 pt-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Stress Assessments</h1>
        <p className="text-gray-400">
          Complete assessments to understand and manage your stress
        </p>
      </div>

      <div className="grid gap-4">
        {templates.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-6 text-center">
              <p className="text-gray-400">
                No assessments available at this time.
              </p>
            </CardContent>
          </Card>
        ) : (
          templates.map((template) => (
            <Card
              key={template._id}
              className="bg-gray-900 border-gray-800 hover:border-blue-500/50 transition cursor-pointer"
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-white">{template.name}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-gray-400">{template.description}</p>

                <div className="flex items-center justify-between">
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                    {template.questions?.length || 0} questions
                  </span>

                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    Start Assessment
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
