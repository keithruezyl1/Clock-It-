/**
 * Fixed clock-in radius for every workplace, in meters. Users can't change
 * this — a workplace is always verified against a 10 km radius.
 */
export const CLOCK_IN_RADIUS_METERS = 10000

/** Fallback center for the manual map picker before any location is chosen. */
export const DEFAULT_MAP_CENTER = { latitude: 10.3157, longitude: 123.8854 } // Cebu City
