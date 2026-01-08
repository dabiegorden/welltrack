"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
import { Download } from "lucide-react";
import { toast } from "sonner";

interface ReportStats {
  totalAssessments: number;
  totalAppointments: number;
  totalSessions: number;
  averageStressLevel: number;
  assessmentTrend: Array<{ month: string; count: number }>;
  stressDistribution: Array<{ name: string; value: number }>;
  appointmentStatus: Array<{ name: string; value: number }>;
}

export default function ReportsPage() {
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/assessments/analytics");
      const result = await response.json();

      console.log("[v0] Analytics response:", result);

      setStats({
        totalAssessments: result.averageStress?.total || 0,
        totalAppointments: 0,
        totalSessions: 0,
        averageStressLevel: result.averageStress?.average || 0,
        assessmentTrend:
          result.trends?.map((t: any) => ({
            month: `${t._id.month}/${t._id.year}`,
            count: t.count,
          })) || [],
        stressDistribution: result.stressDistribution?.map((s: any) => ({
          name:
            s.stressLevel?.charAt(0).toUpperCase() + s.stressLevel?.slice(1) ||
            "Unknown",
          value: s.count || 0,
        })) || [
          { name: "Low", value: 0 },
          { name: "Moderate", value: 0 },
          { name: "High", value: 0 },
        ],
        appointmentStatus: [
          { name: "Scheduled", value: 0 },
          { name: "Completed", value: 0 },
          { name: "Cancelled", value: 0 },
        ],
      });
    } catch (error) {
      console.error("[v0] Failed to fetch reports:", error);
      toast.error("Failed to load report data.");
      // Set default data on error
      setStats({
        totalAssessments: 0,
        totalAppointments: 0,
        totalSessions: 0,
        averageStressLevel: 0,
        assessmentTrend: [],
        stressDistribution: [
          { name: "Low", value: 0 },
          { name: "Moderate", value: 0 },
          { name: "High", value: 0 },
        ],
        appointmentStatus: [
          { name: "Scheduled", value: 0 },
          { name: "Completed", value: 0 },
          { name: "Cancelled", value: 0 },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      const csvContent = [
        ["Report Generated", new Date().toLocaleString()],
        ["Total Assessments", stats?.totalAssessments],
        ["Total Appointments", stats?.totalAppointments],
        ["Total Sessions", stats?.totalSessions],
        ["Average Stress Level", stats?.averageStressLevel.toFixed(2)],
      ]
        .map((row) => row.join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wellness-report-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success("Report exported successfully");
    } catch (error) {
      toast.error("Failed to export report");
    }
  };

  const COLORS = ["#10b981", "#f59e0b", "#ef4444"];

  return (
    <div className="space-y-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">
          Reports & Analytics
        </h1>
        <Button onClick={handleExportReport} className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.totalAssessments || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {stats?.totalAppointments || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.totalSessions || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Stress Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {(stats?.averageStressLevel || 0).toFixed(1)}/100
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {!loading && stats && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Assessment Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Assessment Submissions Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={
                    stats.assessmentTrend && stats.assessmentTrend.length > 0
                      ? stats.assessmentTrend
                      : [{ month: "No data", count: 0 }]
                  }
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    name="Assessments"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Stress Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Stress Level Distribution</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={
                      stats.stressDistribution &&
                      stats.stressDistribution.length > 0
                        ? stats.stressDistribution
                        : [{ name: "No data", value: 1 }]
                    }
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Appointment Status */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Appointment Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={
                    stats.appointmentStatus &&
                    stats.appointmentStatus.length > 0
                      ? stats.appointmentStatus
                      : [{ name: "No data", value: 0 }]
                  }
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Summary Section */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">
                Completion Rate
              </p>
              <p className="text-2xl font-bold">
                {stats && stats.totalAppointments > 0
                  ? (
                      (stats.totalSessions / stats.totalAppointments) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">
                High Stress Cases
              </p>
              <p className="text-2xl font-bold">
                {stats?.stressDistribution.find((s) => s.name === "High")
                  ?.value || 0}
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">
                Pending Appointments
              </p>
              <p className="text-2xl font-bold">
                {stats?.appointmentStatus.find((s) => s.name === "Scheduled")
                  ?.value || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
