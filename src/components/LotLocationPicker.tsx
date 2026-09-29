"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";

type LotLocationPickerProps = {
  initialLocation: string;
  selectedGps: string | null;
  onSelect: (coordinates: string) => void;
};

const CITY_COORDINATES: Record<string, [number, number]> = {
  Pune: [18.5204, 73.8567],
  Mumbai: [19.076, 72.8777],
  Nashik: [19.9975, 73.7898],
  Nagpur: [21.1458, 79.0882],
  Thane: [19.2183, 72.9781],
  Kolkata: [22.5726, 88.3639],
};

export default function LotLocationPicker({
  initialLocation,
  selectedGps,
  onSelect,
}: LotLocationPickerProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      if (!elementRef.current || mapRef.current) return;

      const L = await import("leaflet");
      if (cancelled || !elementRef.current) return;

      const map = L.map(elementRef.current, {
        center: CITY_COORDINATES[initialLocation] ?? [22.5, 79],
        zoom: 5,
        minZoom: 3,
        maxZoom: 18,
        scrollWheelZoom: false,
      });

      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const createMarker = (lat: number, lng: number) => {
        const marker = L.marker([lat, lng], {
          draggable: true,
          icon: L.divIcon({
            className: "",
            html: '<div style="font-size:32px;line-height:32px;text-shadow:0 1px 3px #fff;">📍</div>',
            iconSize: [36, 36],
            iconAnchor: [18, 32],
            popupAnchor: [0, -30],
          }),
        }).addTo(map);

        marker.on("dragend", () => {
          const position = marker.getLatLng();
          onSelectRef.current(
            `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`
          );
        });

        return marker;
      };

      const placeMarker = (lat: number, lng: number) => {
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = createMarker(lat, lng);
        }

        markerRef.current.bindPopup(
          `Selected location<br>${lat.toFixed(6)}, ${lng.toFixed(6)}`
        );

        onSelectRef.current(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      };

      map.on("click", (event) => {
        placeMarker(event.latlng.lat, event.latlng.lng);
      });

      if (selectedGps) {
        const [lat, lng] = selectedGps.split(",").map(Number);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          placeMarker(lat, lng);
          map.setView([lat, lng], 13);
        }
      }
    }

    void initialize();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Initialize the map once; selected coordinates are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedGps) return;

    const [lat, lng] = selectedGps.split(",").map(Number);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    import("leaflet").then((L) => {
      if (!mapRef.current || mapRef.current !== map) return;

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], {
          draggable: true,
          icon: L.divIcon({
            className: "",
            html: '<div style="font-size:32px;line-height:32px;text-shadow:0 1px 3px #fff;">📍</div>',
            iconSize: [36, 36],
            iconAnchor: [18, 32],
            popupAnchor: [0, -30],
          }),
        }).addTo(map);

        marker.on("dragend", () => {
          const position = marker.getLatLng();
          onSelectRef.current(
            `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`
          );
        });

        markerRef.current = marker;
      }

      markerRef.current.bindPopup(
        `Selected location<br>${lat.toFixed(6)}, ${lng.toFixed(6)}`
      );
      map.setView([lat, lng], 13);
    });
  }, [selectedGps]);

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-sage">
        Tap anywhere on the map to place or move your collection pin.
      </p>
      <div
        ref={elementRef}
        role="application"
        aria-label="Map for selecting the e-waste collection location"
        className="h-[300px] w-full overflow-hidden rounded-xl border border-[#cfe0d4] bg-slate-100"
      />
      <p className="text-[11px] text-sage">
        The pin marks the selected coordinates. Map tiles require internet access.
      </p>
    </div>
  );
}