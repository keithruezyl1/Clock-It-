/**
 * Fixed clock-in radius for every workplace, in meters. Users can't change
 * this — a workplace is always verified against a 10 km radius.
 */
export const CLOCK_IN_RADIUS_METERS = 10000

/** Fallback center for the manual map picker before any location is chosen. */
export const DEFAULT_MAP_CENTER = { latitude: 10.3157, longitude: 123.8854 } // Cebu City

/**
 * A session longer than this isn't a plausible shift: the live timer swaps to
 * a "still working?" prompt and manual close-out caps its end time here.
 */
export const MAX_SHIFT_HOURS = 16
