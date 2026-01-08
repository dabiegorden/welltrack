import type React from "react";

interface AppointmentEmailProps {
  appointmentDate: string;
  duration: number;
  counselorEmail: string;
  officerEmail: string;
}

export const AppointmentEmail: React.FC<Readonly<AppointmentEmailProps>> = ({
  appointmentDate,
  duration,
  counselorEmail,
  officerEmail,
}) => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <div
      style={{
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
        width: "100%",
        maxWidth: "600px",
        margin: "0 auto",
        backgroundColor: "#ffffff",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: "40px 20px",
          textAlign: "center",
          color: "#ffffff",
        }}
      >
        <div
          style={{ fontSize: "28px", fontWeight: "800", marginBottom: "8px" }}
        >
          WellTrack
        </div>
        <div style={{ fontSize: "14px", opacity: 0.9 }}>
          Counseling Session Scheduled
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "40px 30px", backgroundColor: "#f8fafc" }}>
        <p
          style={{
            fontSize: "16px",
            fontWeight: "600",
            color: "#1e293b",
            marginBottom: "16px",
          }}
        >
          Your Counseling Session is Confirmed ✓
        </p>

        <div
          style={{
            backgroundColor: "#ffffff",
            border: "2px solid #667eea",
            borderRadius: "8px",
            padding: "24px",
            marginBottom: "24px",
          }}
        >
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                fontSize: "12px",
                fontWeight: "700",
                color: "#667eea",
                marginBottom: "4px",
              }}
            >
              📅 DATE & TIME
            </div>
            <div
              style={{ fontSize: "16px", color: "#1e293b", fontWeight: "600" }}
            >
              {appointmentDate}
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                fontSize: "12px",
                fontWeight: "700",
                color: "#667eea",
                marginBottom: "4px",
              }}
            >
              ⏱️ DURATION
            </div>
            <div
              style={{ fontSize: "16px", color: "#1e293b", fontWeight: "600" }}
            >
              {duration} minutes
            </div>
          </div>

          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "16px" }}>
            <div
              style={{
                fontSize: "12px",
                fontWeight: "700",
                color: "#667eea",
                marginBottom: "8px",
              }}
            >
              👥 PARTICIPANTS
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "#475569",
                marginBottom: "4px",
              }}
            >
              Officer: <strong>{officerEmail}</strong>
            </div>
            <div style={{ fontSize: "14px", color: "#475569" }}>
              Counselor: <strong>{counselorEmail}</strong>
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "6px",
            padding: "12px",
            marginBottom: "24px",
          }}
        >
          <p
            style={{
              fontSize: "13px",
              color: "#166534",
              margin: 0,
              fontWeight: "500",
            }}
          >
            ✓ A confirmation link has been sent to both participants. Please log
            in to the WellTrack system at the scheduled time.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div
        style={{
          padding: "30px",
          backgroundColor: "#ffffff",
          textAlign: "center",
          borderTop: "1px solid #e2e8f0",
        }}
      >
        <a
          href={`${appUrl}/admin-dashboard/appointments`}
          style={{
            display: "inline-block",
            padding: "12px 32px",
            backgroundColor: "#667eea",
            color: "#ffffff",
            textDecoration: "none",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: "600",
          }}
        >
          View Appointment
        </a>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "24px 30px",
          backgroundColor: "#f1f5f9",
          borderTop: "1px solid #e2e8f0",
          textAlign: "center",
          fontSize: "12px",
          color: "#64748b",
        }}
      >
        <p style={{ margin: "0 0 8px 0" }}>
          © 2026 WellTrack. Dedicated to officer wellness and mental health.
        </p>
        <p style={{ margin: 0 }}>
          If you have questions, contact support@jssolutionshub.com
        </p>
      </div>
    </div>
  );
};

export default AppointmentEmail;
