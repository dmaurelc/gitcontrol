import { ImageResponse } from "next/og";

// Site-wide social card. 1200x630 PNG generated at request time.
// Brand: primary lime #D9F26B on near-black #0B0F0A, matching the
// app's globals.css. Logo paths mirror src/app/icon.svg so the card,
// favicon, and apple-touch-icon stay visually consistent.
export const runtime = "nodejs";
export const alt = "GitControl — Self-hosted GitHub Dashboard";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PRIMARY = "#D9F26B";
const BACKGROUND = "#0B0F0A";
const MUTED = "#7A8B6E";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "80px",
          backgroundColor: BACKGROUND,
          backgroundImage:
            "radial-gradient(circle at 85% 15%, rgba(217, 242, 107, 0.12) 0%, transparent 55%)",
          color: PRIMARY,
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <svg
            width="96"
            height="96"
            viewBox="0 0 24 24"
            fill="none"
            stroke={PRIMARY}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 4 L20 8 L12 12 L4 8 Z" />
            <path d="M4 12 L12 16 L20 12" />
            <path d="M4 16 L12 20 L20 16" />
            <circle cx="12" cy="4" r="1.2" fill={PRIMARY} stroke="none" />
            <circle cx="20" cy="8" r="1.2" fill={PRIMARY} stroke="none" />
            <circle cx="4" cy="8" r="1.2" fill={PRIMARY} stroke="none" />
          </svg>
          <span
            style={{
              fontSize: "56px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#FFFFFF",
            }}
          >
            GitControl
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <span
            style={{
              fontSize: "84px",
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: "-0.035em",
              maxWidth: "1000px",
              color: "#FFFFFF",
            }}
          >
            Self-hosted GitHub dashboard
          </span>
          <span
            style={{
              fontSize: "32px",
              color: MUTED,
              maxWidth: "950px",
              lineHeight: 1.35,
            }}
          >
            Repos, issues, pulls, stars and projects in one private workspace.
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            fontSize: "24px",
            color: PRIMARY,
            fontWeight: 500,
          }}
        >
          <span>Encrypted tokens</span>
          <span style={{ color: MUTED }}>·</span>
          <span>Per-user cache</span>
          <span style={{ color: MUTED }}>·</span>
          <span>Your infrastructure</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
