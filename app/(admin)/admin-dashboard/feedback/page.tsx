"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

const STRESS_BADGE: Record<string, string> = {
  low: "text-emerald-400 bg-emerald-500/10",
  moderate: "text-amber-400 bg-amber-500/10",
  high: "text-red-400 bg-red-500/10",
  "not assessed": "text-gray-400 bg-gray-500/10",
};

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<any[]>([]);
  const [counselors, setCounselors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [department, setDepartment] = useState("all");
  const [counselor, setCounselor] = useState("all");
  const [stressLevel, setStressLevel] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (department !== "all") params.append("department", department);
      if (counselor !== "all") params.append("counselor", counselor);
      if (stressLevel !== "all") params.append("stressLevel", stressLevel);
      if (from) params.append("from", from);
      if (to) params.append("to", to);
      const res = await fetch(`/api/admin/feedback?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFeedback(data.feedback || []);
    } catch {
      toast.error("Failed to load feedback");
    } finally {
      setLoading(false);
    }
  }, [department, counselor, stressLevel, from, to]);

  useEffect(() => {
    (async () => {
      const profileRes = await fetch("/api/auth/profile");
      const profileData = await profileRes.json();
      if (!profileData.user || profileData.user.role !== "admin") {
        router.push("/sign-in");
        return;
      }
      const [cRes, dRes] = await Promise.all([
        fetch("/api/admin/users?role=counselor"),
        fetch("/api/admin/departments"),
      ]);
      setCounselors((await cRes.json()).users || []);
      setDepartments((await dRes.json()).departments || []);
    })();
  }, [router]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Counselor Feedback</h1>
        <p className="text-gray-400">
          Monitor counseling session summaries and recommendations
        </p>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-5 gap-3">
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="bg-gray-950 border-gray-800">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent className="bg-gray-950 border-gray-800 text-white">
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d._id} value={d.name}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={counselor} onValueChange={setCounselor}>
            <SelectTrigger className="bg-gray-950 border-gray-800">
              <SelectValue placeholder="Counselor" />
            </SelectTrigger>
            <SelectContent className="bg-gray-950 border-gray-800 text-white">
              <SelectItem value="all">All Counselors</SelectItem>
              {counselors.map((c) => (
                <SelectItem key={c._id} value={c._id}>
                  {c.firstname} {c.lastname}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={stressLevel} onValueChange={setStressLevel}>
            <SelectTrigger className="bg-gray-950 border-gray-800">
              <SelectValue placeholder="Stress Level" />
            </SelectTrigger>
            <SelectContent className="bg-gray-950 border-gray-800 text-white">
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="bg-gray-950 border-gray-800"
          />
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="bg-gray-950 border-gray-800"
          />
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : feedback.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6 text-center text-gray-400">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
            No counselor feedback found for the selected filters.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {feedback.map((f) => (
            <Card key={f._id} className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-white text-lg">
                    {f.officerName}{" "}
                    <span className="text-sm font-normal text-gray-500">
                      ({f.serviceNumber}) • {f.officerDepartment}
                    </span>
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className={`capitalize border-gray-700 ${
                      STRESS_BADGE[f.stressLevel] || ""
                    }`}
                  >
                    {f.stressLevel}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-gray-400">
                  Counselor:{" "}
                  <span className="text-gray-200">{f.counselorName}</span> •
                  Session:{" "}
                  <span className="text-gray-200">
                    {new Date(f.sessionDate).toLocaleString()}
                  </span>
                </p>

                {f.sessionDiscussion && (
                  <Detail label="Session Discussion" value={f.sessionDiscussion} />
                )}
                {f.officerConcerns && (
                  <Detail label="Officer Concerns" value={f.officerConcerns} />
                )}
                {f.counselorObservations && (
                  <Detail
                    label="Counselor Observations"
                    value={f.counselorObservations}
                  />
                )}
                {f.counselingNotes && (
                  <Detail label="Counseling Notes" value={f.counselingNotes} />
                )}
                {f.sessionSummary && (
                  <Detail label="Session Summary" value={f.sessionSummary} />
                )}

                {f.recommendations?.length > 0 && (
                  <div>
                    <p className="text-xs uppercase text-gray-500">
                      Recommendations
                    </p>
                    <ul className="list-disc list-inside text-gray-300">
                      {f.recommendations.map((r: string, i: number) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Badge
                    variant="outline"
                    className="capitalize border-gray-700 text-gray-300"
                  >
                    Follow-up: {f.followUpStatus}
                  </Badge>
                  {f.followUpDate && (
                    <Badge
                      variant="outline"
                      className="border-gray-700 text-gray-300"
                    >
                      Follow-up date:{" "}
                      {new Date(f.followUpDate).toLocaleDateString()}
                    </Badge>
                  )}
                  {f.createdAt && (
                    <span className="text-xs text-gray-500">
                      Recorded {new Date(f.createdAt).toLocaleString()}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase text-gray-500">{label}</p>
      <p className="text-gray-300 whitespace-pre-wrap">{value}</p>
    </div>
  );
}
