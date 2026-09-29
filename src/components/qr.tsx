"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QrBox({ value, size = 148 }: { value: string; size?: number }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(value, { width: size * 2, margin: 1, color: { dark: "#163C33", light: "#FFFFFF" } })
      .then((u) => alive && setUrl(u))
      .catch(() => alive && setUrl(null));
    return () => {
      alive = false;
    };
  }, [value, size]);
  if (!url) return <div className="rounded-lg border border-dashed border-[#cfe0d4] bg-white" style={{ width: size, height: size }} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={`QR verification for ${value}`} width={size} height={size} className="rounded-lg border border-[#dcebe0] bg-white p-1" />
  );
}
