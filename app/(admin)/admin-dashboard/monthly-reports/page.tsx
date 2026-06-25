"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileDown, FileSpreadsheet, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function MonthlyReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const router = useRouter();

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/admin/monthly-reports");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReports(data.reports || []);
    } catch {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const profileRes = await fetch("/api/auth/profile");
      const profileData = await profileRes.json();
      if (!profileData.user || profileData.user.role !== "admin") {
        router.push("/sign-in");
        return;
      }
      fetchReports();
    })();
  }, [router]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/monthly-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: Number(month), year: Number(year) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Report generated");
      fetchReports();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const exportPDF = async (report: any) => {
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Sefwi-Wiawso Divisional Well Track System", 14, 18);
    doc.setFontSize(12);
    doc.text(report.title, 14, 27);

    autoTable(doc, {
      startY: 34,
      head: [["Assessment Statistics", "Count"]],
      body: [
        ["Total Officers Assessed", report.assessmentStats.totalAssessed],
        ["Low Stress", report.assessmentStats.lowStress],
        ["Moderate Stress", report.assessmentStats.moderateStress],
        ["High Stress", report.assessmentStats.highStress],
      ],
    });

    autoTable(doc, {
      head: [["Counseling Statistics", "Count"]],
      body: [
        ["Sessions Completed", report.counselingStats.sessionsCompleted],
        ["Pending Sessions", report.counselingStats.pendingSessions],
        ["Active Counselors", report.counselingStats.activeCounselors],
      ],
    });

    if (report.departmentStats?.length) {
      autoTable(doc, {
        head: [["Department", "Officers", "Low", "Moderate", "High"]],
        body: report.departmentStats.map((d: any) => [
          d.department,
          d.totalOfficers,
          d.lowStress,
          d.moderateStress,
          d.highStress,
        ]),
      });
    }

    doc.save(`${report.title.replace(/\s+/g, "-")}.pdf`);
  };

  const exportExcel = async (report: any) => {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();

    const summary = XLSX.utils.aoa_to_sheet([
      ["Sefwi-Wiawso Divisional Well Track System"],
      [report.title],
      [],
      ["Assessment Statistics", "Count"],
      ["Total Officers Assessed", report.assessmentStats.totalAssessed],
      ["Low Stress", report.assessmentStats.lowStress],
      ["Moderate Stress", report.assessmentStats.moderateStress],
      ["High Stress", report.assessmentStats.highStress],
      [],
      ["Counseling Statistics", "Count"],
      ["Sessions Completed", report.counselingStats.sessionsCompleted],
      ["Pending Sessions", report.counselingStats.pendingSessions],
      ["Active Counselors", report.counselingStats.activeCounselors],
    ]);
    XLSX.utils.book_append_sheet(wb, summary, "Summary");

    if (report.departmentStats?.length) {
      const dept = XLSX.utils.json_to_sheet(report.departmentStats);
      XLSX.utils.book_append_sheet(wb, dept, "Departments");
    }

    XLSX.writeFile(wb, `${report.title.replace(/\s+/g, "-")}.xlsx`);
  };

  const years = Array.from({ length: 6 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Monthly Reports</h1>
        <p className="text-gray-400">
          Generate and export monthly wellness reports
        </p>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="pt-6 flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Month</label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-40 bg-gray-950 border-gray-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-950 border-gray-800 text-white">
                {MONTHS.map((m, i) => (
                  <SelectItem key={m} value={String(i + 1)}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Year</label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-32 bg-gray-950 border-gray-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-950 border-gray-800 text-white">
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {generating ? (
              <Spinner className="mr-2 h-4 w-4" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Generate Report
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : reports.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6 text-center text-gray-400">
            No reports generated yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reports.map((r) => (
            <Card key={r._id} className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="text-white">{r.title}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportPDF(r)}
                    >
                      <FileDown className="mr-1 h-4 w-4" /> PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportExcel(r)}
                    >
                      <FileSpreadsheet className="mr-1 h-4 w-4" /> Excel
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <Stat label="Assessed" value={r.assessmentStats.totalAssessed} />
                <Stat
                  label="High Stress"
                  value={r.assessmentStats.highStress}
                  className="text-red-400"
                />
                <Stat
                  label="Sessions Completed"
                  value={r.counselingStats.sessionsCompleted}
                />
                <Stat
                  label="Pending Sessions"
                  value={r.counselingStats.pendingSessions}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  className = "",
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className="rounded-lg bg-gray-950/50 border border-gray-800 p-3 text-center">
      <p className={`text-xl font-bold ${className || "text-white"}`}>{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}
