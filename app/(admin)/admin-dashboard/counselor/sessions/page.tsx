"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const STRESS_COLORS = ["#10B981", "#F59E0B", "#EF4444"];

const STRESS_BADGE: Record<string, string> = {
  low: "text-emerald-400 bg-emerald-500/10",
  moderate: "text-amber-400 bg-amber-500/10",
  high: "text-red-400 bg-red-500/10",
};

const REPORT_TEMPLATES = [
  { value: "initial-assessment", label: "Initial Assessment Report" },
  { value: "follow-up-counseling", label: "Follow-up Counseling Report" },
  { value: "final-counseling", label: "Final Counseling Report" },
  { value: "general-wellness", label: "General Wellness Report" },
];

const RECOMMENDATION_TYPES = [
  { value: "further-counseling", label: "Further counseling required" },
  { value: "follow-up-session", label: "Follow-up session needed" },
  { value: "reduced-workload", label: "Reduced workload recommendation" },
  { value: "wellness-improvement", label: "Wellness improvement suggestion" },
  { value: "other", label: "Other" },
];

export default function CounselorSessionsPage() {
  const [officers, setOfficers] = useState<any[]>([]);
  const [officerId, setOfficerId] = useState("");
  const [history, setHistory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const profileRes = await fetch("/api/auth/profile");
      const profileData = await profileRes.json();
      if (!profileData.user || profileData.user.role !== "counselor") {
        router.push("/admin-dashboard");
        return;
      }
      const res = await fetch("/api/admin/users?role=officer");
      setOfficers((await res.json()).users || []);
      setLoading(false);
    })();
  }, [router]);

  const loadHistory = async (id: string) => {
    if (!id) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/counselor/officer-history/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setHistory(data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  const onSelectOfficer = (id: string) => {
    setOfficerId(id);
    setHistory(null);
    loadHistory(id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Counseling Sessions</h1>
        <p className="text-gray-400">
          Record sessions, prescriptions, recommendations and reports
        </p>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="pt-6">
          <label className="text-sm text-gray-400">Select Officer</label>
          <Select value={officerId} onValueChange={onSelectOfficer}>
            <SelectTrigger className="bg-gray-950 border-gray-800 mt-1 max-w-md">
              <SelectValue placeholder="Choose an officer" />
            </SelectTrigger>
            <SelectContent className="bg-gray-950 border-gray-800 text-white">
              {officers.map((o) => (
                <SelectItem key={o._id} value={o._id}>
                  {o.firstname} {o.lastname}
                  {o.serviceNumber ? ` (${o.serviceNumber})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {!officerId ? (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6 text-center text-gray-400">
            Select an officer to view history and record counseling.
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="history">
          <TabsList className="bg-gray-900 border border-gray-800">
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="session">New Session</TabsTrigger>
            <TabsTrigger value="prescription">Prescription</TabsTrigger>
            <TabsTrigger value="recommendation">Recommendation</TabsTrigger>
            <TabsTrigger value="report">Report</TabsTrigger>
          </TabsList>

          <TabsContent value="history">
            {loadingHistory ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : (
              <OfficerHistory history={history} />
            )}
          </TabsContent>

          <TabsContent value="session">
            <SessionForm officerId={officerId} onSaved={() => loadHistory(officerId)} />
          </TabsContent>

          <TabsContent value="prescription">
            <PrescriptionForm
              officerId={officerId}
              onSaved={() => loadHistory(officerId)}
            />
          </TabsContent>

          <TabsContent value="recommendation">
            <RecommendationForm officerId={officerId} />
          </TabsContent>

          <TabsContent value="report">
            <ReportForm
              officerId={officerId}
              onSaved={() => loadHistory(officerId)}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );

  function OfficerHistory({ history }: { history: any }) {
    if (!history) return null;
    const o = history.officer;

    // Chronological stress score trend
    const trend = [...history.assessments]
      .reverse()
      .map((a: any) => ({
        date: new Date(a.completedAt || a.createdAt).toLocaleDateString(),
        score: a.totalScore,
      }));

    const distribution = [
      {
        name: "Low",
        value: history.assessments.filter((a: any) => a.stressLevel === "low")
          .length,
      },
      {
        name: "Moderate",
        value: history.assessments.filter(
          (a: any) => a.stressLevel === "moderate"
        ).length,
      },
      {
        name: "High",
        value: history.assessments.filter((a: any) => a.stressLevel === "high")
          .length,
      },
    ];
    const hasDist = distribution.some((d) => d.value > 0);

    // Sessions per follow-up status
    const followUp = ["none", "pending", "scheduled", "completed"].map(
      (status) => ({
        status,
        count: history.sessions.filter((s: any) => s.followUpStatus === status)
          .length,
      })
    );

    return (
      <div className="space-y-4 mt-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white">
              {o.firstname} {o.lastname}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-400 grid grid-cols-2 md:grid-cols-4 gap-2">
            <span>Service No: {o.serviceNumber || "—"}</span>
            <span>Rank: {o.rank || "—"}</span>
            <span>Unit: {o.unit || "—"}</span>
            <span>Dept: {o.department || "—"}</span>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base">
                Stress Score Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart
                  data={trend.length ? trend : [{ date: "No data", score: 0 }]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis stroke="#9CA3AF" dataKey="date" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111827",
                      border: "1px solid #374151",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3B82F6"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base">
                Stress Level Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={hasDist ? distribution : [{ name: "No data", value: 1 }]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name} (${value})`}
                    outerRadius={75}
                    dataKey="value"
                  >
                    {(hasDist ? distribution : [{ name: "No data", value: 1 }]).map(
                      (_, i) => (
                        <Cell
                          key={i}
                          fill={hasDist ? STRESS_COLORS[i] : "#374151"}
                        />
                      )
                    )}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base">
                Sessions by Follow-up Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={followUp}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis stroke="#9CA3AF" dataKey="status" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111827",
                      border: "1px solid #374151",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#6366F1" name="Sessions" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base">
              Stress History ({history.assessments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {history.assessments.length === 0 ? (
              <p className="text-gray-500 text-sm">No assessments yet.</p>
            ) : (
              history.assessments.map((a: any) => (
                <div
                  key={a._id}
                  className="flex items-center justify-between text-sm border-b border-gray-800 pb-1"
                >
                  <span className="text-gray-400">
                    {new Date(a.completedAt || a.createdAt).toLocaleDateString()}{" "}
                    • Score {a.totalScore}
                  </span>
                  <Badge
                    variant="outline"
                    className={`capitalize border-gray-700 ${
                      STRESS_BADGE[a.stressLevel] || ""
                    }`}
                  >
                    {a.stressLevel}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base">
              Previous Sessions ({history.sessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {history.sessions.length === 0 ? (
              <p className="text-gray-500 text-sm">No sessions recorded.</p>
            ) : (
              history.sessions.map((s: any) => (
                <div key={s._id} className="text-sm border-b border-gray-800 pb-2">
                  <p className="text-gray-400">
                    {new Date(s.sessionDate).toLocaleDateString()} • Follow-up:{" "}
                    {s.followUpStatus}
                  </p>
                  {s.sessionSummary && (
                    <p className="text-gray-300">{s.sessionSummary}</p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base">
              Reports ({history.reports.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {history.reports.length === 0 ? (
              <p className="text-gray-500 text-sm">No reports created.</p>
            ) : (
              history.reports.map((r: any) => (
                <div
                  key={r._id}
                  className="rounded-lg border border-gray-800 bg-gray-950/50 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-white">{r.title}</p>
                    <Badge
                      variant="outline"
                      className="capitalize border-gray-700 text-gray-300"
                    >
                      {(r.templateType || "").replace(/-/g, " ")}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(r.reportDate).toLocaleString()}
                  </p>
                  {r.assessmentResult && (
                    <ReportField label="Assessment Result" value={r.assessmentResult} />
                  )}
                  {r.sessionSummary && (
                    <ReportField label="Session Summary" value={r.sessionSummary} />
                  )}
                  {r.counselorNotes && (
                    <ReportField label="Counselor Notes" value={r.counselorNotes} />
                  )}
                  {r.recommendations && (
                    <ReportField label="Recommendations" value={r.recommendations} />
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base">
              Prescriptions ({history.prescriptions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {history.prescriptions.length === 0 ? (
              <p className="text-gray-500">No prescriptions.</p>
            ) : (
              history.prescriptions.map((p: any) => (
                <div
                  key={p._id}
                  className="rounded-lg border border-gray-800 bg-gray-950/50 p-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-white font-medium">{p.title}</p>
                    <Badge
                      variant="outline"
                      className="capitalize border-gray-700 text-gray-300"
                    >
                      {p.status}
                    </Badge>
                  </div>
                  {p.description && (
                    <p className="text-gray-400 mt-1">{p.description}</p>
                  )}
                  {p.supportPlan && (
                    <p className="text-gray-400 mt-1">
                      Plan: {p.supportPlan}
                    </p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
}

/* ---------------- Sub-forms ---------------- */

function SessionForm({
  officerId,
  onSaved,
}: {
  officerId: string;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    sessionDiscussion: "",
    officerConcerns: "",
    counselorObservations: "",
    counselingNotes: "",
    sessionSummary: "",
    followUpStatus: "none",
    followUpDate: "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/counselor/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ officerId, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Session recorded");
      setForm({
        sessionDiscussion: "",
        officerConcerns: "",
        counselorObservations: "",
        counselingNotes: "",
        sessionSummary: "",
        followUpStatus: "none",
        followUpDate: "",
      });
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800 mt-4">
      <CardHeader>
        <CardTitle className="text-white text-base">
          What went on between the counselor and the officer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Field label="Session Discussion">
          <Textarea
            value={form.sessionDiscussion}
            onChange={(e) =>
              setForm({ ...form, sessionDiscussion: e.target.value })
            }
            className="bg-gray-950 border-gray-800"
          />
        </Field>
        <Field label="Officer Concerns">
          <Textarea
            value={form.officerConcerns}
            onChange={(e) =>
              setForm({ ...form, officerConcerns: e.target.value })
            }
            className="bg-gray-950 border-gray-800"
          />
        </Field>
        <Field label="Counselor Observations">
          <Textarea
            value={form.counselorObservations}
            onChange={(e) =>
              setForm({ ...form, counselorObservations: e.target.value })
            }
            className="bg-gray-950 border-gray-800"
          />
        </Field>
        <Field label="Counseling Notes">
          <Textarea
            value={form.counselingNotes}
            onChange={(e) =>
              setForm({ ...form, counselingNotes: e.target.value })
            }
            className="bg-gray-950 border-gray-800"
          />
        </Field>
        <Field label="Session Summary">
          <Textarea
            value={form.sessionSummary}
            onChange={(e) =>
              setForm({ ...form, sessionSummary: e.target.value })
            }
            className="bg-gray-950 border-gray-800"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Follow-up Status">
            <Select
              value={form.followUpStatus}
              onValueChange={(v) => setForm({ ...form, followUpStatus: v })}
            >
              <SelectTrigger className="bg-gray-950 border-gray-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-950 border-gray-800 text-white">
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Follow-up Date">
            <Input
              type="date"
              value={form.followUpDate}
              onChange={(e) =>
                setForm({ ...form, followUpDate: e.target.value })
              }
              className="bg-gray-950 border-gray-800"
            />
          </Field>
        </div>
        <Button
          onClick={submit}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {saving ? <Spinner className="mr-2 h-4 w-4" /> : null}
          Save Session
        </Button>
      </CardContent>
    </Card>
  );
}

function PrescriptionForm({
  officerId,
  onSaved,
}: {
  officerId: string;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    supportPlan: "",
    followUpDate: "",
    status: "active",
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    setSaving(true);
    try {
      const res = await fetch("/api/counselor/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ officerId, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Prescription saved");
      setForm({
        title: "",
        description: "",
        supportPlan: "",
        followUpDate: "",
        status: "active",
      });
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800 mt-4">
      <CardHeader>
        <CardTitle className="text-white text-base">New Prescription</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Field label="Prescription Title">
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="bg-gray-950 border-gray-800"
          />
        </Field>
        <Field label="Description">
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="bg-gray-950 border-gray-800"
          />
        </Field>
        <Field label="Support Plan">
          <Textarea
            value={form.supportPlan}
            onChange={(e) => setForm({ ...form, supportPlan: e.target.value })}
            className="bg-gray-950 border-gray-800"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Follow-up Date">
            <Input
              type="date"
              value={form.followUpDate}
              onChange={(e) =>
                setForm({ ...form, followUpDate: e.target.value })
              }
              className="bg-gray-950 border-gray-800"
            />
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v })}
            >
              <SelectTrigger className="bg-gray-950 border-gray-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-950 border-gray-800 text-white">
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Button
          onClick={submit}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {saving ? <Spinner className="mr-2 h-4 w-4" /> : null}
          Save Prescription
        </Button>
      </CardContent>
    </Card>
  );
}

function RecommendationForm({ officerId }: { officerId: string }) {
  const [type, setType] = useState("further-counseling");
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!details.trim()) return toast.error("Details are required");
    setSaving(true);
    try {
      const res = await fetch("/api/counselor/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ officerId, type, details }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Recommendation submitted");
      setDetails("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800 mt-4">
      <CardHeader>
        <CardTitle className="text-white text-base">
          Submit Recommendation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Field label="Type">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="bg-gray-950 border-gray-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-950 border-gray-800 text-white">
              {RECOMMENDATION_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Details">
          <Textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="bg-gray-950 border-gray-800"
          />
        </Field>
        <Button
          onClick={submit}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {saving ? <Spinner className="mr-2 h-4 w-4" /> : null}
          Submit Recommendation
        </Button>
      </CardContent>
    </Card>
  );
}

function ReportForm({
  officerId,
  onSaved,
}: {
  officerId: string;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    templateType: "general-wellness",
    title: "",
    assessmentResult: "",
    counselorNotes: "",
    sessionSummary: "",
    recommendations: "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.title.trim()) return toast.error("Report title is required");
    setSaving(true);
    try {
      const res = await fetch("/api/counselor/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ officerId, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Report created");
      setForm({
        templateType: "general-wellness",
        title: "",
        assessmentResult: "",
        counselorNotes: "",
        sessionSummary: "",
        recommendations: "",
      });
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800 mt-4">
      <CardHeader>
        <CardTitle className="text-white text-base">
          Create Counseling Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Field label="Report Template">
          <Select
            value={form.templateType}
            onValueChange={(v) => setForm({ ...form, templateType: v })}
          >
            <SelectTrigger className="bg-gray-950 border-gray-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-950 border-gray-800 text-white">
              {REPORT_TEMPLATES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Title">
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="bg-gray-950 border-gray-800"
          />
        </Field>
        <Field label="Assessment Result">
          <Textarea
            value={form.assessmentResult}
            onChange={(e) =>
              setForm({ ...form, assessmentResult: e.target.value })
            }
            className="bg-gray-950 border-gray-800"
          />
        </Field>
        <Field label="Counselor Notes">
          <Textarea
            value={form.counselorNotes}
            onChange={(e) =>
              setForm({ ...form, counselorNotes: e.target.value })
            }
            className="bg-gray-950 border-gray-800"
          />
        </Field>
        <Field label="Session Summary">
          <Textarea
            value={form.sessionSummary}
            onChange={(e) =>
              setForm({ ...form, sessionSummary: e.target.value })
            }
            className="bg-gray-950 border-gray-800"
          />
        </Field>
        <Field label="Recommendations">
          <Textarea
            value={form.recommendations}
            onChange={(e) =>
              setForm({ ...form, recommendations: e.target.value })
            }
            className="bg-gray-950 border-gray-800"
          />
        </Field>
        <Button
          onClick={submit}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {saving ? <Spinner className="mr-2 h-4 w-4" /> : null}
          Create Report
        </Button>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-300">{label}</label>
      {children}
    </div>
  );
}

function ReportField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase text-gray-500">{label}</p>
      <p className="text-gray-300 whitespace-pre-wrap text-sm">{value}</p>
    </div>
  );
}
