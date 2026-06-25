"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";

const STATUS_BADGE: Record<string, string> = {
  scheduled: "text-blue-400 bg-blue-500/10",
  completed: "text-emerald-400 bg-emerald-500/10",
  cancelled: "text-red-400 bg-red-500/10",
};

export default function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
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
        const res = await fetch("/api/appointments");
        const data = await res.json();
        setAppointments(data.data || []);
      } catch {
        toast.error("Failed to load appointments");
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
          <h1 className="text-3xl font-bold text-white">My Appointments</h1>
          <p className="text-gray-400">Your counseling appointment history</p>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => router.push("/admin-dashboard/counseling")}
        >
          Book Counseling
        </Button>
      </div>

      {appointments.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6 text-center text-gray-400">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
            You have no counseling appointments yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {appointments.map((a) => (
            <Card key={a._id} className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg">
                    {a.counselorId
                      ? `${a.counselorId.firstname} ${a.counselorId.lastname}`
                      : "Counselor"}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className={`capitalize border-gray-700 ${
                      STATUS_BADGE[a.status] || ""
                    }`}
                  >
                    {a.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-gray-400">
                <p>{new Date(a.date).toLocaleString()}</p>
                <p>Duration: {a.duration || 60} minutes</p>
                {a.notes && <p className="text-gray-300">Notes: {a.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
