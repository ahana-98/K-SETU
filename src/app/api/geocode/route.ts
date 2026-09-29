import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");

    if (!lat || !lon) {
      return NextResponse.json(
        { error: "Latitude and longitude are required." },
        { status: 400 }
      );
    }

    const url =
      `https://nominatim.openstreetmap.org/reverse` +
      `?format=jsonv2&lat=${encodeURIComponent(lat)}` +
      `&lon=${encodeURIComponent(lon)}` +
      `&zoom=10&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "K-SETU/1.0",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Reverse geocoding failed." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const address = data.address ?? {};

    const city =
      address.city ||
      address.town ||
      address.municipality ||
      address.village ||
      address.county ||
      "";

    return NextResponse.json({
      city,
      state: address.state ?? "",
      country: address.country ?? "",
      displayName: data.display_name ?? "",
    });
  } catch (error) {
    console.error("Geocoding error:", error);

    return NextResponse.json(
      { error: "Unable to detect city from GPS coordinates." },
      { status: 500 }
    );
  }
}