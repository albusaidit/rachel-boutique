import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0a0a0a",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 44,
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontWeight: 400,
          letterSpacing: "0.04em",
          paddingBottom: 4,
        }}
      >
        R
      </div>
    ),
    { ...size },
  );
}
