// "use client";

import type React from "react";

interface EmailTemplateProps {
  firstName: string;
  email: string;
  password?: string;
  role: string;
  isNewUser?: boolean;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  firstName,
  email,
  password,
  role,
  isNewUser = false,
}) => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const roleFeatures: Record<string, string[]> = {
    admin: [
      "Manage user accounts and roles",
      "View system analytics and reports",
      "Configure wellness programs",
    ],
    officer: [
      "Complete wellness assessments",
      "Access wellness resources",
      "Book counseling sessions",
      "Participate in peer support forums",
    ],
    counselor: [
      "Manage counseling sessions",
      "View officer wellness assessments",
      "Provide professional support",
    ],
  };

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
      {/* Header with gradient background */}
      <div
        style={{
          background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
          padding: "40px 20px",
          textAlign: "center",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            fontSize: "32px",
            fontWeight: "800",
            marginBottom: "10px",
            letterSpacing: "-0.5px",
          }}
        >
          WellTrack
        </div>
        <div
          style={{
            fontSize: "14px",
            opacity: 0.9,
            fontWeight: "500",
            letterSpacing: "0.5px",
          }}
        >
          WELLNESS MANAGEMENT SYSTEM
        </div>
      </div>

      {/* Welcome Section */}
      <div style={{ padding: "40px 30px", backgroundColor: "#f8fafc" }}>
        <div style={{ marginBottom: "24px" }}>
          <p
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#1e293b",
              margin: "0 0 8px 0",
            }}
          >
            Welcome, {firstName}! 👋
          </p>
          <p
            style={{
              fontSize: "14px",
              color: "#64748b",
              margin: 0,
              lineHeight: "1.6",
            }}
          >
            Your {role.charAt(0).toUpperCase() + role.slice(1)} account has been
            successfully created on WellTrack.
          </p>
        </div>
      </div>

      {/* Login Credentials Section */}
      {isNewUser && password && (
        <div style={{ padding: "30px", borderTop: "1px solid #e2e8f0" }}>
          <div style={{ marginBottom: "16px" }}>
            <p
              style={{
                fontSize: "12px",
                fontWeight: "700",
                color: "#64748b",
                margin: "0 0 12px 0",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              🔐 Your Login Credentials
            </p>
          </div>

          {/* Credentials Box */}
          <div
            style={{
              backgroundColor: "#f0f9ff",
              border: "2px solid #bfdbfe",
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "16px",
            }}
          >
            <div style={{ marginBottom: "16px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "6px",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#1e293b",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>✉️</span> Email
                </span>
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#0c4a6e",
                  fontFamily: "monospace",
                  fontWeight: "500",
                  wordBreak: "break-all",
                }}
              >
                {email}
              </div>
            </div>
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "6px",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#1e293b",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>🔑</span> Temporary Password
                </span>
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#0c4a6e",
                  fontFamily: "monospace",
                  fontWeight: "500",
                  wordBreak: "break-all",
                }}
              >
                {password}
              </div>
            </div>
          </div>

          {/* Security Warning */}
          <div
            style={{
              backgroundColor: "#fef3c7",
              border: "1px solid #fcd34d",
              borderRadius: "6px",
              padding: "12px",
              marginBottom: "16px",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                color: "#78350f",
                margin: 0,
                lineHeight: "1.5",
                fontWeight: "500",
              }}
            >
              ⚠️ <strong>Important:</strong> Please change your temporary
              password immediately after your first login.
            </p>
          </div>
        </div>
      )}

      {/* Features Section */}
      <div
        style={{
          padding: "30px",
          backgroundColor: "#ffffff",
          borderTop: "1px solid #e2e8f0",
        }}
      >
        <p
          style={{
            fontSize: "12px",
            fontWeight: "700",
            color: "#64748b",
            margin: "0 0 16px 0",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          ⭐ What You Can Do
        </p>
        <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
          {(
            roleFeatures[role as keyof typeof roleFeatures] ||
            roleFeatures.officer
          ).map((feature, index) => (
            <li
              key={index}
              style={{
                marginBottom: "12px",
                fontSize: "14px",
                color: "#334155",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span
                style={{
                  color: "#2563eb",
                  fontWeight: "bold",
                  fontSize: "16px",
                }}
              >
                ✓
              </span>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {/* CTA Button Section */}
      <div
        style={{
          padding: "30px",
          backgroundColor: "#f8fafc",
          textAlign: "center",
          borderTop: "1px solid #e2e8f0",
        }}
      >
        <a
          href={`${appUrl}/sign-in`}
          style={{
            display: "inline-block",
            padding: "14px 40px",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            textDecoration: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "600",
            letterSpacing: "0.5px",
            transition: "all 0.3s ease",
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "#1d4ed8";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "#2563eb";
          }}
        >
          🚀 Login to WellTrack
        </a>
        <p
          style={{
            fontSize: "12px",
            color: "#64748b",
            marginTop: "16px",
            margin: "16px 0 0 0",
          }}
        >
          Can&apos;t click the button? Copy and paste this URL in your browser:
          <br />
          <span
            style={{
              color: "#2563eb",
              wordBreak: "break-all",
              fontFamily: "monospace",
              fontSize: "11px",
            }}
          >
            {appUrl}/sign-in
          </span>
        </p>
      </div>

      {/* Role Badge & Info */}
      <div
        style={{
          padding: "24px 30px",
          backgroundColor: "#ffffff",
          borderTop: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "#f0f9ff",
            borderRadius: "6px",
            border: "1px solid #bfdbfe",
          }}
        >
          <p
            style={{
              fontSize: "12px",
              color: "#0c4a6e",
              margin: 0,
              fontWeight: "600",
            }}
          >
            👤 Account Type:{" "}
            <span style={{ textTransform: "capitalize" }}>{role}</span>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "24px 30px",
          backgroundColor: "#f1f5f9",
          borderTop: "1px solid #e2e8f0",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: "12px",
            color: "#64748b",
            margin: "0 0 12px 0",
            lineHeight: "1.6",
          }}
        >
          If you have any questions or issues accessing your account, please
          contact the administrator at
          <br />
          <a
            href="mailto:support@jssolutionshub.com"
            style={{
              color: "#2563eb",
              textDecoration: "none",
              fontWeight: "600",
            }}
          >
            support@jssolutionshub.com
          </a>
        </p>
        <div
          style={{
            borderTop: "1px solid #cbd5e1",
            paddingTop: "12px",
            marginTop: "12px",
          }}
        >
          <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>
            © 2026 WellTrack. All rights reserved.
            <br />
            Dedicated to officer wellness and mental health.
          </p>
        </div>
      </div>
    </div>
  );
};
