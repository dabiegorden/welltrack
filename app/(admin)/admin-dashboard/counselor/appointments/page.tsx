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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Trash2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

interface Appointment {
  _id: string;
  officerId: {
    _id: string;
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
  duration?: number;
  notes?: string;
  status: "scheduled" | "completed" | "cancelled";
  createdAt: string;
}

export default function CounselorAppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  // editable fields
  const [editDate, setEditDate] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState("scheduled");
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/appointments");
      if (!res.ok) {
        if (res.status === 403) router.push("/admin-dashboard");
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

  const openDetail = (appt: Appointment) => {
    setSelected(appt);
    setEditDate(new Date(appt.date).toISOString().slice(0, 16));
    setEditNotes(appt.notes || "");
    setEditStatus(appt.status);
    setReplyMessage("");
    setIsDetailOpen(true);
  };

  const handleSave = async () => {
    if (!selected) return;
    setUpdating(true);
    try {
      const res = await fetch("/api/appointments/counselor", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: selected._id,
          status: editStatus,
          date: new Date(editDate).toISOString(),
          notes: editNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      toast.success("Appointment updated");
      setAppointments((prev) =>
        prev.map((a) => (a._id === selected._id ? data.appointment : a))
      );
      setSelected(data.appointment);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!confirm("Delete this appointment?")) return;
    try {
      const res = await fetch(
        `/api/appointments/counselor?id=${selected._id}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      toast.success("Appointment deleted");
      setAppointments((prev) => prev.filter((a) => a._id !== selected._id));
      setIsDetailOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleReply = async () => {
    if (!selected || !replyMessage.trim())
      return toast.error("Enter a message");
    setSendingReply(true);
    try {
      const res = await fetch("/api/appointments/counselor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: selected._id,
          message: replyMessage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      toast.success("Reply sent to officer");
      setReplyMessage("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSendingReply(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-500/20 text-blue-300";
      case "completed":
        return "bg-emerald-500/20 text-emerald-300";
      case "cancelled":
        return "bg-red-500/20 text-red-300";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  const formatDate = (s: string) =>
    new Date(s).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-8 text-white">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Appointments
        </h1>
        <p className="text-gray-400 mt-2">
          Manage your counseling appointments with officers
        </p>
      </div>

      {appointments.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <p className="text-center text-gray-400">
              No appointments booked yet
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {appointments.map((appointment) => (
            <Card
              key={appointment._id}
              className="bg-gray-900 border-gray-800 hover:border-blue-500/50 transition cursor-pointer"
              onClick={() => openDetail(appointment)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg text-white">
                        {appointment.officerId.firstname}{" "}
                        {appointment.officerId.lastname}
                      </h3>
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-300 mb-1">
                      Email: {appointment.officerId.email}
                    </p>
                    {appointment.officerId.phone && (
                      <p className="text-sm text-gray-300 mb-1">
                        Phone: {appointment.officerId.phone}
                      </p>
                    )}
                    <p className="text-sm font-medium text-gray-200 mt-3">
                      {formatDate(appointment.date)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="border-gray-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDetail(appointment);
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
        <DialogContent className="bg-gray-950 border-gray-800 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Appointment Details</DialogTitle>
            <DialogDescription className="text-gray-400">
              {selected &&
                `${selected.officerId.firstname} ${selected.officerId.lastname}`}
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-300">Officer</p>
                <p className="text-white">
                  {selected.officerId.firstname} {selected.officerId.lastname}
                </p>
                <p className="text-sm text-gray-400">
                  {selected.officerId.email}
                </p>
                {selected.officerId.phone && (
                  <p className="text-sm text-gray-400">
                    {selected.officerId.phone}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">
                    Date & Time
                  </label>
                  <Input
                    type="datetime-local"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="bg-gray-900 border-gray-800 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">
                    Status
                  </label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger className="bg-gray-900 border-gray-800 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-950 border-gray-800 text-white">
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-300">
                  Notes
                </label>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="bg-gray-900 border-gray-800 text-white"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleSave}
                  disabled={updating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updating ? <Spinner className="mr-2 h-4 w-4" /> : null}
                  Save Changes
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </div>

              <div className="border-t border-gray-800 pt-4 space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Reply to officer (email)
                </label>
                <Textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Message to the officer about preparation for the appointment..."
                  className="bg-gray-900 border-gray-800 text-white"
                />
                <Button
                  onClick={handleReply}
                  disabled={sendingReply}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {sendingReply ? (
                    <Spinner className="mr-2 h-4 w-4" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  Send Reply
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
