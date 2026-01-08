"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  Calendar,
  AlertCircle,
  Loader2,
  FileText,
  Clipboard,
} from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface AdminStats {
  totalOfficers: number;
  totalCounselors: number;
  totalAssessments: number;
  highStressCount: number;
  totalSessions: number;
  totalResources: number;
  totalTemplates: number;
  avgStressLevel: number;
}

interface OfficerStats {
  totalAssessments: number;
  lastStressLevel: string;
  lastScore: number;
  totalBookings: number;
  upcomingAppointments: number;
}

interface CounselorStats {
  assignedOfficers: number;
  totalSessions: number;
  upcomingSessions: number;
  highStressOfficersCount: number;
}

type Stats = AdminStats | OfficerStats | CounselorStats;

interface DashboardData {
  role: string;
  stats: Stats;
  charts?: {
    assessmentTrend?: Array<{ date: string; count: number }>;
    stressDistribution?: Array<{ name: string; value: number }>;
    stressProgress?: Array<{ date: string; score: number }>;
    sessionDistribution?: Array<{ status: string; count: number }>;
  };
}

const STRESS_COLORS = {
  low: "#10B981",
  moderate: "#F59E0B",
  high: "#EF4444",
};

const EMPTY_PIE_DATA = [{ name: "No data", value: 1 }];

const DEFAULT_EMPTY_TREND = Array.from({ length: 7 }, (_, i) => {
  const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
  return {
    date: date.toISOString().split("T")[0],
    count: 0,
  };
});

const DEFAULT_STRESS_DIST = [
  { name: "Low", value: 0 },
  { name: "Moderate", value: 0 },
  { name: "High", value: 0 },
];

const DEFAULT_SESSION_DIST = [
  { status: "Scheduled", count: 0 },
  { status: "Completed", count: 0 },
  { status: "Cancelled", count: 0 },
];

export default function DashboardPage() {
  const { data, isLoading, error } = useSWR<DashboardData>(
    "/api/dashboard/stats",
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-red-400">
        Failed to load dashboard stats
      </div>
    );
  }

  const stressDist = data?.charts?.stressDistribution ?? DEFAULT_STRESS_DIST;

  const totalStress = stressDist.reduce((sum, item) => sum + item.value, 0);

  const pieData = totalStress === 0 ? EMPTY_PIE_DATA : stressDist;

  return (
    <div className="space-y-8 pt-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">
          Welcome back! Here's your wellness overview.
        </p>
      </div>

      {data?.role === "admin" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Total Officers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-white">
                    {(data.stats as AdminStats).totalOfficers}
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Total Counselors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-white">
                    {(data.stats as AdminStats).totalCounselors}
                  </div>
                  <Users className="h-8 w-8 text-indigo-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Assessments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-white">
                    {(data.stats as AdminStats).totalAssessments}
                  </div>
                  <Clipboard className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">
                  High Stress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-white">
                    {(data.stats as AdminStats).highStressCount}
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-white">
                    {(data.stats as AdminStats).totalSessions}
                  </div>
                  <Calendar className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Resources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-white">
                    {(data.stats as AdminStats).totalResources}
                  </div>
                  <FileText className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-white">
                    {(data.stats as AdminStats).totalTemplates}
                  </div>
                  <Clipboard className="h-8 w-8 text-pink-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Assessments Trend</CardTitle>
                <CardDescription>Last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={
                      data?.charts?.assessmentTrend &&
                      data.charts.assessmentTrend.length > 0
                        ? data.charts.assessmentTrend
                        : DEFAULT_EMPTY_TREND
                    }
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
                      dataKey="count"
                      stroke="#3B82F6"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
                {(!data?.charts?.assessmentTrend ||
                  data.charts.assessmentTrend.length === 0) && (
                  <p className="text-center text-gray-500 text-sm mt-2">
                    No assessment data yet
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">
                  Stress Level Distribution
                </CardTitle>
                <CardDescription>Current status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) =>
                        totalStress === 0 ? "No data" : `${name} (${value})`
                      }
                      outerRadius={80}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            totalStress === 0
                              ? "#374151" // neutral gray
                              : Object.values(STRESS_COLORS)[index]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                {(!data?.charts?.stressDistribution ||
                  data.charts.stressDistribution.every(
                    (item: any) => item.value === 0
                  )) && (
                  <p className="text-center text-gray-500 text-sm mt-2">
                    No stress data yet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {data?.role === "officer" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Assessments Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-white">
                    {(data.stats as OfficerStats).totalAssessments}
                  </div>
                  <Clipboard className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Current Stress Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {(data.stats as OfficerStats).lastScore}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {(data.stats as OfficerStats).lastStressLevel}
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Counseling Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-white">
                    {(data.stats as OfficerStats).totalBookings}
                  </div>
                  <Calendar className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Upcoming Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-white">
                    {(data.stats as OfficerStats).upcomingAppointments}
                  </div>
                  <Calendar className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Your Stress Progress</CardTitle>
              <CardDescription>Trend over time (30 days)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={
                    data?.charts?.stressProgress &&
                    data.charts.stressProgress.length > 0
                      ? data.charts.stressProgress
                      : DEFAULT_EMPTY_TREND
                  }
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
              {(!data?.charts?.stressProgress ||
                data.charts.stressProgress.length === 0) && (
                <p className="text-center text-gray-500 text-sm mt-2">
                  No stress progress data yet
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {data?.role === "counselor" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Assigned Officers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-white">
                    {(data.stats as CounselorStats).assignedOfficers}
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Total Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-white">
                    {(data.stats as CounselorStats).totalSessions}
                  </div>
                  <Calendar className="h-8 w-8 text-indigo-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Upcoming Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-white">
                    {(data.stats as CounselorStats).upcomingSessions}
                  </div>
                  <Calendar className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">
                  High Stress Officers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-white">
                    {(data.stats as CounselorStats).highStressOfficersCount}
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">
                Session Load Distribution
              </CardTitle>
              <CardDescription>Number of sessions by status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={
                    data?.charts?.sessionDistribution &&
                    data.charts.sessionDistribution.length > 0
                      ? data.charts.sessionDistribution
                      : DEFAULT_SESSION_DIST
                  }
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis stroke="#9CA3AF" dataKey="status" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111827",
                      border: "1px solid #374151",
                    }}
                  />
                  <Bar dataKey="count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
              {(!data?.charts?.sessionDistribution ||
                data.charts.sessionDistribution.length === 0) && (
                <p className="text-center text-gray-500 text-sm mt-2">
                  No session data yet
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
