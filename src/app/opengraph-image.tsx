import { ImageResponse } from "next/og";
import { brand, verified } from "@/lib/config/business";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Maitri Residency — A taste that feels closer. Karimnagar, Telangana.";

/** Open Graph card, generated at build time from the same verified facts. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "linear-gradient(140deg, #0a0706 0%, #1a1210 52%, #2a1a10 100%)",
          color: "#f6f1e7",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 999,
                border: "1px solid rgba(221,160,74,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#dda04a",
                fontSize: 20,
              }}
            >
              M
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 22, letterSpacing: 1 }}>{brand.name}</span>
              <span style={{ fontSize: 13, letterSpacing: 4, color: "#9c9184" }}>
                KARIMNAGAR · TELANGANA
              </span>
            </div>
          </div>
          <span
            style={{
              fontSize: 13,
              letterSpacing: 3,
              color: "#e8b44a",
              border: "1px solid rgba(232,180,74,0.35)",
              borderRadius: 999,
              padding: "8px 16px",
            }}
          >
            CONCEPT BUILD
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <span style={{ fontSize: 74, lineHeight: 1.02, letterSpacing: -1.5, maxWidth: 900 }}>
            A taste that feels closer.
          </span>
          <span style={{ fontSize: 24, color: "#cfc3ae", maxWidth: 820 }}>
            Sample menu, order builder and a delivery experience prepared for {brand.hospitalityName}.
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(246,241,231,0.14)",
            paddingTop: 22,
          }}
        >
          <span style={{ fontSize: 15, color: "#9c9184" }}>
            Delivery line {verified.deliveryPhone.display}
          </span>
          <span style={{ fontSize: 13, letterSpacing: 3, color: "#6f6558" }}>
            SAMPLE MENU · NOT THE OFFICIAL SITE
          </span>
        </div>
      </div>
    ),
    size,
  );
}
