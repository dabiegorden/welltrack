"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface Appointment {
  _id: string;
  officerId: {
    firstname: string;
    lastname: string;
    email: string;
    phone?: string;
  };
  counselorId: {
    firstname: string;
    lastname: string;
    email: string;
  };
  date: string;
  notes?: string;
  status: "scheduled" | "completed" | "cancelled";
  createdAt: string;
}

export default function CounselorAppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/appointments");
      if (!res.ok) {
        if (res.status === 403) {
          router.push("/admin-dashboard");
        }
        throw new Error("Failed to fetch appointments");
      }
      const data = await res.json();
      setAppointments(data.data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (
    appointmentId: string,
    newStatus: string
  ) => {
    try {
      setUpdating(true);
      const res = await fetch("/api/appointments/counselor", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId,
          status: newStatus,
        }),
      });

      if (!res.ok) throw new Error("Failed to update appointment");

      const data = await res.json();
      setAppointments(
        appointments.map((apt) =>
          apt._id === appointmentId ? data.appointment : apt
        )
      );

      if (selectedAppointment?._id === appointmentId) {
        setSelectedAppointment(data.appointment);
      }
    } catch (error) {
      console.error("[v0] Error updating appointment:", error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
        <p className="text-gray-600 mt-2">
          Manage your counseling appointments with officers
        </p>
      </div>

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">
              No appointments booked yet
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {appointments.map((appointment) => (
            <Card
              key={appointment._id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedAppointment(appointment);
                setIsDetailOpen(true);
              }}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">
                        {appointment.officerId.firstname}{" "}
                        {appointment.officerId.lastname}
                      </h3>
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      Email: {appointment.officerId.email}
                    </p>
                    {appointment.officerId.phone && (
                      <p className="text-sm text-gray-600 mb-1">
                        Phone: {appointment.officerId.phone}
                      </p>
                    )}
                    <p className="text-sm font-medium text-gray-700 mt-3">
                      {formatDate(appointment.date)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAppointment(appointment);
                      setIsDetailOpen(true);
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>
              {selectedAppointment &&
                `${selectedAppointment.officerId.firstname} ${selectedAppointment.officerId.lastname}`}
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Officer
                </label>
                <p className="mt-1">
                  {selectedAppointment.officerId.firstname}{" "}
                  {selectedAppointment.officerId.lastname}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedAppointment.officerId.email}
                </p>
                {selectedAppointment.officerId.phone && (
                  <p className="text-sm text-gray-600">
                    {selectedAppointment.officerId.phone}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Date & Time
                </label>
                <p className="mt-1">{formatDate(selectedAppointment.date)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Notes
                </label>
                <p className="mt-1 text-gray-700">
                  {selectedAppointment.notes || "No notes provided"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Status
                </label>
                <Select
                  value={selectedAppointment.status}
                  onValueChange={(value) =>
                    handleStatusChange(selectedAppointment._id, value)
                  }
                  disabled={updating}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
