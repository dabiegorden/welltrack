"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, MoreHorizontal, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface User {
  _id: string;
  firstname: string;
  lastname: string;
  email: string;
  role: "officer" | "counselor";
}

interface Appointment {
  _id: string;
  officerId: User;
  counselorId: User;
  date: string;
  duration: number;
  status: "scheduled" | "completed" | "cancelled";
  notes?: string;
  createdAt: string;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [officers, setOfficers] = useState<User[]>([]);
  const [counselors, setCounselors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [userType, setUserType] = useState<"officer" | "counselor">("officer");
  const [formData, setFormData] = useState({
    officerId: "",
    counselorId: "",
    date: "",
    duration: 60,
    status: "scheduled",
    notes: "",
  });

  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchAppointments(), fetchUsers()]);
    } catch (error) {
      console.error("[v0] Error fetching data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await fetch("/api/appointments");
      if (!response.ok)
        throw new Error(`Failed with status ${response.status}`);
      const result = await response.json();
      console.log("[v0] Appointments fetched:", result);
      setAppointments(result.data || []);
    } catch (error) {
      console.error("[v0] Error fetching appointments:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const [officersRes, counselorsRes] = await Promise.all([
        fetch("/api/admin/users?role=officer"),
        fetch("/api/admin/users?role=counselor"),
      ]);

      if (!officersRes.ok || !counselorsRes.ok) {
        throw new Error("Failed to fetch users");
      }

      const officersData = await officersRes.json();
      const counselorsData = await counselorsRes.json();

      console.log("[v0] Officers fetched:", officersData);
      console.log("[v0] Counselors fetched:", counselorsData);

      setOfficers(officersData.users || []);
      setCounselors(counselorsData.users || []);
    } catch (error) {
      console.error("[v0] Error fetching users:", error);
      toast.error("Failed to fetch officers and counselors");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        officerId: userType === "officer" ? formData.officerId : "",
        counselorId: userType === "counselor" ? formData.counselorId : "",
      };

      console.log("[v0] Submitting appointment:", submitData);

      const response = await fetch("/api/appointments", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingId ? { id: editingId, ...submitData } : submitData
        ),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save");
      }

      toast.success(
        editingId ? "Appointment updated" : "Appointment created and email sent"
      );
      setOpen(false);
      setFormData({
        officerId: "",
        counselorId: "",
        date: "",
        duration: 60,
        status: "scheduled",
        notes: "",
      });
      setUserType("officer");
      setEditingId(null);
      fetchAppointments();
    } catch (error) {
      console.error("[v0] Error saving appointment:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save appointment"
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      const response = await fetch(`/api/appointments?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      toast.success("Appointment deleted");
      fetchAppointments();
    } catch (error) {
      console.error("[v0] Error deleting appointment:", error);
      toast.error("Failed to delete");
    }
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingId(appointment._id);
    setFormData({
      officerId:
        typeof appointment.officerId === "string"
          ? appointment.officerId
          : appointment.officerId._id,
      counselorId:
        typeof appointment.counselorId === "string"
          ? appointment.counselorId
          : appointment.counselorId._id,
      date: new Date(appointment.date).toISOString().slice(0, 16),
      duration: appointment.duration,
      status: appointment.status,
      notes: appointment.notes || "",
    });
    setUserType(appointment.officerId ? "officer" : "counselor");
    setOpen(true);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setEditingId(null);
      setFormData({
        officerId: "",
        counselorId: "",
        date: "",
        duration: 60,
        status: "scheduled",
        notes: "",
      });
      setUserType("officer");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="space-y-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">
          Appointments Management
        </h1>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Schedule Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-125">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Appointment" : "Schedule Appointment"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Who is this appointment with?
                  </label>
                  <Tabs
                    value={userType}
                    onValueChange={(value) => {
                      setUserType(value as "officer" | "counselor");
                      setFormData({
                        ...formData,
                        officerId:
                          value === "officer" ? formData.officerId : "",
                        counselorId:
                          value === "counselor" ? formData.counselorId : "",
                      });
                    }}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="officer">Officer</TabsTrigger>
                      <TabsTrigger value="counselor">Counselor</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              )}

              {userType === "officer" && officers.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Select Officer
                  </label>
                  <Select
                    value={formData.officerId}
                    onValueChange={(value) => {
                      console.log("Selected officer:", value);
                      setFormData({ ...formData, officerId: value });
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose an officer" />
                    </SelectTrigger>
                    <SelectContent>
                      {officers.map((officer) => (
                        <SelectItem key={officer._id} value={officer._id}>
                          {officer.firstname} {officer.lastname} (
                          {officer.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {userType === "officer" && officers.length === 0 && (
                <div className="text-sm text-red-600">
                  No officers available
                </div>
              )}

              {userType === "counselor" && counselors.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Select Counselor
                  </label>
                  <Select
                    value={formData.counselorId}
                    onValueChange={(value) => {
                      console.log("Selected counselor:", value);
                      setFormData({ ...formData, counselorId: value });
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a counselor" />
                    </SelectTrigger>
                    <SelectContent>
                      {counselors.map((counselor) => (
                        <SelectItem key={counselor._id} value={counselor._id}>
                          {counselor.firstname} {counselor.lastname} (
                          {counselor._id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {userType === "counselor" && counselors.length === 0 && (
                <div className="text-sm text-red-600">
                  No counselors available
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  Date & Time
                </label>
                <Input
                  required
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Duration (minutes)
                </label>
                <Input
                  required
                  type="number"
                  min="15"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration: Number.parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <Input
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Session notes"
                />
              </div>
              <Button type="submit" className="w-full">
                {editingId ? "Update" : "Schedule"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Appointments ({appointments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : appointments.length === 0 ? (
            <p className="text-muted-foreground">No appointments found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Officer</TableHead>
                    <TableHead>Counselor</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((apt) => (
                    <TableRow key={apt._id}>
                      <TableCell className="text-sm">
                        {apt.officerId
                          ? `${apt.officerId.firstname} ${apt.officerId.lastname}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {apt.counselorId
                          ? `${apt.counselorId.firstname} ${apt.counselorId.lastname}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {new Date(apt.date).toLocaleString()}
                      </TableCell>
                      <TableCell>{apt.duration} min</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(apt.status)}`}
                        >
                          {apt.status.charAt(0).toUpperCase() +
                            apt.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(apt)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(apt._id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
