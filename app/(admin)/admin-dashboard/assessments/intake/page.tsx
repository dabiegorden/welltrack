"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OfficerAssessmentIntake } from "@/components/assessments/officer-assessment-intake";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type RiskLevel = "low" | "moderate" | "high" | null;

export default function AssessmentIntakePage() {
  const [user, setUser] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [assessmentResult, setAssessmentResult] = useState<RiskLevel>(null);
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
  const handleAssessmentComplete = (result: RiskLevel) => {
    setAssessmentResult(result);
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
  if (assessmentResult) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Card className="max-w-md w-full bg-gray-900 border-gray-800">
          <CardHeader className="text-center">
            <CardTitle className="text-white">Assessment Result</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 text-center">
            <p
              className={`text-2xl font-bold ${
                assessmentResult === "low"
                  ? "text-green-400"
                  : assessmentResult === "moderate"
                    ? "text-yellow-400"
                    : "text-red-400"
              }`}
            >
              {assessmentResult.toUpperCase()} STRESS LEVEL
            </p>

            {assessmentResult === "low" && (
              <p className="text-gray-400">
                Your stress level is within a healthy range. Keep practicing
                good wellness habits.
              </p>
            )}

            {assessmentResult === "moderate" && (
              <p className="text-gray-400">
                You may be experiencing increased stress. Consider wellness
                resources or peer support.
              </p>
            )}

            {assessmentResult === "high" && (
              <p className="text-gray-400">
                We strongly recommend booking a confidential session with a
                counselor.
              </p>
            )}

            <div className="flex flex-col gap-3">
              {assessmentResult === "high" && (
                <Button
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => router.push("/admin-dashboard/counseling")}
                >
                  Book Counselor
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => router.push("/admin-dashboard")}
              >
                Go to Dashboard
              </Button>

              <Button
                variant="ghost"
                onClick={() => {
                  setAssessmentResult(null);
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
