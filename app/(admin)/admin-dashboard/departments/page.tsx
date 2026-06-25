"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Building2,
  Users,
  Plus,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

const STRESS_BADGE: Record<string, string> = {
  low: "text-emerald-400 bg-emerald-500/10",
  moderate: "text-amber-400 bg-amber-500/10",
  high: "text-red-400 bg-red-500/10",
  "not assessed": "text-gray-400 bg-gray-500/10",
};

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/admin/departments");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDepartments(data.departments || []);
    } catch {
      toast.error("Failed to load departments");
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
      fetchDepartments();
    })();
  }, [router]);

  const handleCreate = async () => {
    if (!name.trim()) return toast.error("Name is required");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Department created");
      setDialogOpen(false);
      setName("");
      fetchDepartments();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Departments</h1>
          <p className="text-gray-400">
            Officers and stress statistics by department
          </p>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> New Department
        </Button>
      </div>

      <div className="grid gap-4">
        {departments.map((dept) => (
          <Card key={dept._id} className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Building2 className="h-5 w-5 text-blue-400" />
                  {dept.name}
                </CardTitle>
                <Badge variant="outline" className="border-gray-700 text-gray-300">
                  <Users className="mr-1 h-3 w-3" />
                  {dept.totalOfficers} officers
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
                  <p className="text-xl font-bold text-emerald-400">
                    {dept.lowStress}
                  </p>
                  <p className="text-xs text-gray-400">Low</p>
                </div>
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-center">
                  <p className="text-xl font-bold text-amber-400">
                    {dept.moderateStress}
                  </p>
                  <p className="text-xs text-gray-400">Moderate</p>
                </div>
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-center">
                  <p className="text-xl font-bold text-red-400">
                    {dept.highStress}
                  </p>
                  <p className="text-xs text-gray-400">High</p>
                </div>
              </div>

              {dept.totalOfficers > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-300"
                  onClick={() =>
                    setExpanded(expanded === dept._id ? null : dept._id)
                  }
                >
                  {expanded === dept._id ? (
                    <ChevronUp className="mr-1 h-4 w-4" />
                  ) : (
                    <ChevronDown className="mr-1 h-4 w-4" />
                  )}
                  View officers
                </Button>
              )}

              {expanded === dept._id && (
                <div className="space-y-2">
                  {dept.officers.map((o: any) => (
                    <div
                      key={o._id}
                      className="flex items-center justify-between rounded-lg bg-gray-950/50 border border-gray-800 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm text-white">{o.name}</p>
                        <p className="text-xs text-gray-500">
                          {o.serviceNumber || "—"}
                          {o.rank ? ` • ${o.rank}` : ""}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`capitalize border-gray-700 ${
                          STRESS_BADGE[o.stressLevel] || ""
                        }`}
                      >
                        {o.stressLevel}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md bg-gray-950 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>New Department</DialogTitle>
            <DialogDescription className="text-gray-400">
              Add a new division department.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Department name"
            className="bg-gray-900 border-gray-800"
          />
          <DialogFooter>
            <Button
              onClick={handleCreate}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
