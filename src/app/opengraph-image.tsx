import { ImageResponse } from "next/og";

// Next will fetch this route and emit a static 1200x630 PNG for the
// site-wide OG/Twitter card. Per-route overrides can live in nested
// segments by exporting another opengraph-image.tsx.
export const runtime = "nodejs";
export const alt = "GitControl — Self-hosted GitHub Dashboard";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
          background:
            "radial-gradient(circle at 30% 20%, #1f2937 0%, #030712 60%)",
          color: "#f8fafc",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <svg
            width="64"
            height="64"
            viewBox="0 0 32 32"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="3"
              y="3"
              width="26"
              height="26"
              rx="6"
              fill="none"
              stroke="#a7f3d0"
              strokeWidth="3"
            />
            <path
              d="M10 16h12M16 10v12"
              stroke="#a7f3d0"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          <span style={{ fontSize: "32px", fontWeight: 600, letterSpacing: "-0.02em" }}>
            GitControl
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <span
            style={{
              fontSize: "80px",
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              maxWidth: "950px",
            }}
          >
            Self-hosted GitHub dashboard
          </span>
          <span
            style={{
              fontSize: "32px",
              color: "#9ca3af",
              maxWidth: "900px",
              lineHeight: 1.3,
            }}
          >
            Repos, issues, pulls, stars and projects in one private workspace.
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: "22px",
            color: "#9ca3af",
          }}
        >
          <span>Encrypted tokens</span>
          <span>·</span>
          <span>Per-user cache</span>
          <span>·</span>
          <span>Your infrastructure</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
