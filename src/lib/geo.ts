export interface Coords {
  latitude: number
  longitude: number
  accuracy?: number
}

export interface ReverseGeocode {
  place_name: string | null
  address: string | null
  city: string | null
  region: string | null
  country: string | null
}

/** Haversine distance in meters between two coordinates. */
export function distanceMeters(a: Coords, b: Coords): number {
  const R = 6371e3
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.latitude - a.latitude)
  const dLng = toRad(b.longitude - a.longitude)
  const lat1 = toRad(a.latitude)
  const lat2 = toRad(b.latitude)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`
  return `${(m / 1000).toFixed(m < 10000 ? 2 : 1)} km`
}

/** Get current GPS position as a promise. */
export function getCurrentPosition(
  options: PositionOptions = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported on this device.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => reject(new Error(geoErrorMessage(err))),
      options,
    )
  })
}

function geoErrorMessage(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return 'Location permission denied. Please enable location access in your browser settings.'
    case err.POSITION_UNAVAILABLE:
      return 'Your location is currently unavailable. Try again in a moment.'
    case err.TIMEOUT:
      return 'Timed out getting your location. Please try again.'
    default:
      return 'Could not get your location.'
  }
}

/** Reverse geocode via OpenStreetMap Nominatim (no API key needed). */
export async function reverseGeocode(coords: Coords): Promise<ReverseGeocode> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}&zoom=18&addressdetails=1`,
      { headers: { Accept: 'application/json' } },
    )
    if (!res.ok) throw new Error('geocode failed')
    const data = await res.json()
    const a = data.address ?? {}
    return {
      place_name:
        a.building || a.office || a.amenity || a.shop || a.commercial || data.name || null,
      address: data.display_name ?? null,
      city: a.city || a.town || a.village || a.municipality || a.suburb || null,
      region: a.state || a.region || a.county || null,
      country: a.country || null,
    }
  } catch {
    return { place_name: null, address: null, city: null, region: null, country: null }
  }
}
