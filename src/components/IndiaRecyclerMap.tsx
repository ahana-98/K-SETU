"use client";

import { useEffect, useRef } from "react";

export type MapRecycler = {
  name: string;
  facilityLocation: string;
  serviceArea?: string;
  authorizationStatus?: string;
};

type IndiaRecyclerMapProps = {
  recyclers: MapRecycler[];
};

const CITY_COORDINATES: Record<string, [number, number]> = {
  Pune: [18.5204, 73.8567],
  Mumbai: [19.076, 72.8777],
  Nashik: [19.9975, 73.7898],
  Nagpur: [21.1458, 79.0882],
  Thane: [19.2183, 72.9781],
  Kolkata: [22.5726, 88.3639],
};

export default function IndiaRecyclerMap({
  recyclers,
}: IndiaRecyclerMapProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function initializeMap() {
      if (!mapElement.current || mapInstance.current) return;

      const L = await import("leaflet");
      if (cancelled || !mapElement.current) return;

      const map = L.map(mapElement.current, {
        center: [22.5, 79],
        zoom: 4,
        minZoom: 3,
        maxZoom: 18,
        scrollWheelZoom: true,
      });

      mapInstance.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Group recyclers by city so markers remain easy to select.
      const groups = new Map<string, MapRecycler[]>();

      for (const recycler of recyclers) {
        const city = recycler.facilityLocation.trim();
        if (!CITY_COORDINATES[city]) continue;

        const existing = groups.get(city) ?? [];
        existing.push(recycler);
        groups.set(city, existing);
      }

      for (const [city, cityRecyclers] of groups) {
        const [lat, lng] = CITY_COORDINATES[city];

        const marker = L.circleMarker([lat, lng], {
          radius: 10,
          color: "#ffffff",
          weight: 2,
          fillColor: "#23834b",
          fillOpacity: 0.95,
        }).addTo(map);

        const recyclerRows = cityRecyclers
          .map(
            (recycler) => `
              <li style="margin: 8px 0;">
                <strong>${escapeHtml(recycler.name)}</strong>
                <br />
                <span style="color:#52665b;font-size:12px;">
                  ${escapeHtml(recycler.authorizationStatus ?? "Status not specified")}
                </span>
              </li>
            `
          )
          .join("");

        marker.bindPopup(`
          <div style="min-width:180px;max-width:260px;font-family:Arial,sans-serif;">
            <strong style="font-size:15px;">${escapeHtml(city)}</strong>
            <p style="margin:5px 0;color:#52665b;">
              ${cityRecyclers.length} recycler${cityRecyclers.length === 1 ? "" : "s"}
            </p>
            <ul style="padding-left:18px;margin:8px 0;">
              ${recyclerRows}
            </ul>
            <small style="color:#6b7280;">
              Approximate city-center location; demo data.
            </small>
          </div>
        `);

        marker.bindTooltip(`${city} · ${cityRecyclers.length}`, {
          direction: "top",
          offset: [0, -8],
        });
      }

      // Fit the map to the cities represented in the dataset.
      const locations = [...groups.keys()].map(
        (city) => CITY_COORDINATES[city]
      );

      if (locations.length > 1) {
        map.fitBounds(L.latLngBounds(locations), {
          padding: [35, 35],
          maxZoom: 6,
        });
      } else if (locations.length === 1) {
        map.setView(locations[0], 6);
      }
    }

    void initializeMap();

    return () => {
      cancelled = true;
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, [recyclers]);

  return (
    <section className="w-full space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-forest">
            Recycler network across India
          </h2>
          <p className="text-sm text-sage">
            Select a green marker to view recyclers in that city.
          </p>
        </div>
        <span className="rounded-full bg-mint px-3 py-1 text-xs font-medium text-forest">
          {recyclers.length} recyclers
        </span>
      </div>

      <div
        ref={mapElement}
        aria-label="Interactive map showing recycler cities in India"
        className="h-[420px] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
      />

      <p className="text-xs text-sage">
        Markers use approximate city-center coordinates, not exact facility
        addresses. Map tiles require an internet connection.
      </p>
    </section>
  );
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}