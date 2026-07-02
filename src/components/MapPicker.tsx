import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const pinIcon = L.divIcon({
  className: '',
  html: `<div style="
      width:26px;height:26px;border-radius:50% 50% 50% 0;
      background:linear-gradient(135deg,#a78bfa,#8b5cf6);
      transform:rotate(-45deg);
      box-shadow:0 4px 10px rgba(124,58,237,0.4);
      border:2.5px solid #fff;"></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
})

/**
 * Interactive map for manually pinning a workplace. Tap the map or drag the
 * pin to choose a spot; `onPick` fires with the new coordinates.
 */
export function MapPicker({
  lat,
  lng,
  onPick,
}: {
  lat: number
  lng: number
  onPick: (lat: number, lng: number) => void
}) {
  const elRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const onPickRef = useRef(onPick)
  onPickRef.current = onPick

  useEffect(() => {
    if (!elRef.current || mapRef.current) return
    const map = L.map(elRef.current, { attributionControl: false }).setView([lat, lng], 15)
    mapRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map)

    const marker = L.marker([lat, lng], { draggable: true, icon: pinIcon }).addTo(map)
    markerRef.current = marker

    marker.on('dragend', () => {
      const p = marker.getLatLng()
      onPickRef.current(p.lat, p.lng)
    })
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng)
      onPickRef.current(e.latlng.lat, e.latlng.lng)
    })

    // The map is created inside a modal that animates in; recompute size once
    // the container has settled so tiles fill it correctly.
    const t = setTimeout(() => map.invalidateSize(), 150)

    return () => {
      clearTimeout(t)
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep the pin/view in sync when coordinates change from outside (e.g. after
  // "Use my current location").
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return
    markerRef.current.setLatLng([lat, lng])
    mapRef.current.setView([lat, lng])
  }, [lat, lng])

  return (
    <div
      ref={elRef}
      className="h-60 w-full overflow-hidden rounded-2xl border-2 border-lavender-100"
      style={{ zIndex: 0 }}
    />
  )
}
