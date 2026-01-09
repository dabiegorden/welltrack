"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Calendar, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function CounselingPage() {
  const [counselors, setCounselors] = useState<any[]>([]);
  const [selectedCounselor, setSelectedCounselor] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const router = useRouter();

  /* ---------------- Fetch counselors ---------------- */
  useEffect(() => {
    const fetchCounselors = async () => {
      try {
        const response = await fetch("/api/users/counselors");
        const data = await response.json();
        setCounselors(data.counselors || []);
      } catch (error) {
        console.error("Error fetching counselors:", error);
        toast.error("Failed to load counselors");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCounselors();
  }, []);

  /* ---------------- Submit booking ---------------- */
  const handleSubmit = async () => {
    if (!selectedCounselor || !appointmentDate || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/appointments/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          counselorId: selectedCounselor,
          date: new Date(appointmentDate).toISOString(),
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to book appointment");
        return;
      }

      setSubmitted(true);
      toast.success("Appointment booked successfully");

      // ✅ Officer-safe redirect
      setTimeout(() => {
        router.push("/admin-dashboard");
      }, 2000);
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Failed to book appointment");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------------- Success state ---------------- */
  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md border-green-500/20 bg-green-50/5">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-green-300">Appointment Booked</CardTitle>
            <CardDescription>
              Your counseling session has been scheduled. The counselor has been
              notified.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  /* ---------------- Loading state ---------------- */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  /* ---------------- Main form ---------------- */
  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold text-white">
          Book a Counseling Session
        </h1>
        <p className="text-gray-400 mt-2">
          Schedule a confidential session with a professional counselor
        </p>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Appointment Details</CardTitle>
          <CardDescription>
            Choose a counselor and preferred time
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert className="border-blue-500/30 bg-blue-50/5">
            <AlertCircle className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-blue-300">
              This session is confidential. Only the assigned counselor will be
              notified.
            </AlertDescription>
          </Alert>

          {/* Counselor select */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">
              Select Counselor
            </label>
            <Select
              value={selectedCounselor}
              onValueChange={setSelectedCounselor}
            >
              <SelectTrigger className="bg-gray-800/50 border-gray-700">
                <SelectValue placeholder="Choose a counselor" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {counselors.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No counselors available
                  </SelectItem>
                ) : (
                  counselors.map((counselor) => (
                    <SelectItem key={counselor._id} value={counselor._id}>
                      {counselor.firstname} {counselor.lastname}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">
              Preferred Date & Time
            </label>
            <Input
              type="datetime-local"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="bg-gray-800/50 border-gray-700"
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">
              Notes (Optional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Share anything you'd like the counselor to know"
              className="bg-gray-800/50 border-gray-700"
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedCounselor || !appointmentDate}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Book Appointment
                </>
              )}
            </Button>

            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
