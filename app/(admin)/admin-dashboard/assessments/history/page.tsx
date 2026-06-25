"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ClipboardList } from "lucide-react";
import { toast } from "sonner";

const STRESS_BADGE: Record<string, string> = {
  low: "text-emerald-400 bg-emerald-500/10",
  moderate: "text-amber-400 bg-amber-500/10",
  high: "text-red-400 bg-red-500/10",
};

export default function AssessmentHistoryPage() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const profileRes = await fetch("/api/auth/profile");
        const profileData = await profileRes.json();
        if (!profileData.user || profileData.user.role !== "officer") {
          router.push("/admin-dashboard");
          return;
        }
        const res = await fetch("/api/assessments");
        const data = await res.json();
        setAssessments(data.data || []);
      } catch {
        toast.error("Failed to load assessment history");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">My Assessment History</h1>
          <p className="text-gray-400">Your previous stress assessment results</p>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => router.push("/admin-dashboard/assessments/intake")}
        >
          New Assessment
        </Button>
      </div>

      {assessments.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6 text-center text-gray-400">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-20" />
            You haven&apos;t completed any assessments yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {assessments.map((a) => {
            const needsCounseling =
              a.stressLevel === "moderate" || a.stressLevel === "high";
            return (
              <Card key={a._id} className="bg-gray-900 border-gray-800">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-lg">
                      {a.templateId?.name || "Stress Assessment"}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={`capitalize border-gray-700 ${
                        STRESS_BADGE[a.stressLevel] || ""
                      }`}
                    >
                      {a.stressLevel}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-400">
                  <p>
                    Score: <span className="text-gray-200">{a.totalScore}</span>
                    {a.maxScore ? ` / ${a.maxScore}` : ""} •{" "}
                    {new Date(a.completedAt || a.createdAt).toLocaleDateString()}
                  </p>
                  {needsCounseling && (
                    <p className="text-red-300">
                      Recommendation: Consider booking a counseling session.
                    </p>
                  )}
                  {a.aiAnalysis?.summary && (
                    <p className="text-gray-300">{a.aiAnalysis.summary}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
