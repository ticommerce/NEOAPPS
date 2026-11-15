import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { site } from "@/config/site";

export const alt = site.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const t = await getTranslations("landing.hero");
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#0e6b50",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 36, fontWeight: 700 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              marginRight: 20,
              borderRadius: 18,
              background: "#ffffff",
              color: "#0e6b50",
            }}
          >
            R
          </div>
          {site.name}
        </div>
        <div style={{ display: "flex", fontSize: 76, fontWeight: 800, lineHeight: 1.05, maxWidth: 980 }}>
          {t("title")}
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#f4a340" }}>{t("eyebrow")}</div>
      </div>
    ),
    size,
  );
}
