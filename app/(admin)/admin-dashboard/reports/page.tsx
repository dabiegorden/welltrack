"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
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
} from "recharts"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ReportStats {
  totalAssessments: number
  averageStressLevel: number
  stressDistribution: Array<{ stressLevel: string; count: number }>
  trends: Array<{ _id: { year: number; month: number }; count: number }>
}

export default function ReportsPage() {
  const [stats, setStats] = useState<ReportStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/assessments/analytics")
      const result = await response.json()

      console.log("[v0] Analytics response:", result)

      const chartData = (result.trends || []).map((t: any) => ({
        month: `${t._id.month}/${t._id.year}`,
        count: t.count,
      }))

      setStats({
        totalAssessments: result.totalAssessments || 0,
        averageStressLevel: result.averageStress?.average || 0,
        stressDistribution: (result.stressDistribution || []).map((s: any) => ({
          stressLevel: s.stressLevel?.charAt(0).toUpperCase() + s.stressLevel?.slice(1) || "Unknown",
          count: s.count || 0,
        })),
        trends: chartData,
      })
    } catch (error) {
      console.error("[v0] Failed to fetch reports:", error)
      toast.error("Failed to load report data.")
      setStats({
        totalAssessments: 0,
        averageStressLevel: 0,
        stressDistribution: [
          { stressLevel: "Low", count: 0 },
          { stressLevel: "Moderate", count: 0 },
          { stressLevel: "High", count: 0 },
        ],
        trends: [],
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExportReport = async () => {
    try {
      const csvContent = [
        ["Report Generated", new Date().toLocaleString()],
        [""],
        ["Summary Statistics"],
        ["Total Assessments", stats?.totalAssessments || 0],
        ["Average Stress Level", (stats?.averageStressLevel || 0).toFixed(2)],
        [""],
        ["Stress Distribution"],
        ["Stress Level", "Count"],
        ...(stats?.stressDistribution.map((s) => [s.stressLevel, s.count]) || []),
      ]
        .map((row) => row.join(","))
        .join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `wellness-report-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)

      toast.success("Report exported successfully")
    } catch (error) {
      console.error("[v0] Error exporting report:", error)
      toast.error("Failed to export report")
    }
  }

  const COLORS = ["#10b981", "#f59e0b", "#ef4444"]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
        <Button onClick={handleExportReport} className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Assessments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.totalAssessments || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Stress Level</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{(stats?.averageStressLevel || 0).toFixed(1)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">High Stress Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {stats?.stressDistribution.find((s) => s.stressLevel === "High")?.count || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {stats && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Assessment Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Assessment Submissions Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={stats.trends && stats.trends.length > 0 ? stats.trends : [{ month: "No data", count: 0 }]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" name="Assessments" />
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
                      stats.stressDistribution && stats.stressDistribution.length > 0
                        ? stats.stressDistribution
                        : [{ stressLevel: "No data", count: 1 }]
                    }
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${(entry.payload as any).stressLevel}: ${(entry.payload as any).count}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
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
        </div>
      )}

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Assessment Completion Rate</p>
              <p className="text-2xl font-bold">{stats?.totalAssessments ? "Active" : "No Data"}</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Most Common Stress Level</p>
              <p className="text-2xl font-bold">
                {stats?.stressDistribution.length
                  ? stats.stressDistribution.reduce((prev, current) => (prev.count > current.count ? prev : current))
                      .stressLevel
                  : "N/A"}
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Average Assessment Score</p>
              <p className="text-2xl font-bold">{(stats?.averageStressLevel || 0).toFixed(1)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
