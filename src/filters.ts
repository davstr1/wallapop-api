/**
 * Geographic filters for Wallapop search results.
 *
 * Continental Spain = Peninsula + enclaves on the peninsula.
 * Excludes: Canarias (35xxx, 38xxx), Baleares (07xxx), Ceuta (51xxx), Melilla (52xxx).
 */

// Postal code prefixes that are NOT continental Spain
const NON_CONTINENTAL_PREFIXES = [
  '07', // Baleares
  '35', // Las Palmas (Canarias)
  '38', // Santa Cruz de Tenerife (Canarias)
  '51', // Ceuta
  '52', // Melilla
];

// Bounding box for continental Spain (generous)
const CONTINENTAL_BBOX = {
  latMin: 35.9,  // Southern tip (Tarifa)
  latMax: 43.85, // Northern tip (Galicia/Asturias)
  lonMin: -9.4,  // Western tip (Portugal border)
  lonMax: 3.4,   // Eastern tip (Cap de Creus)
};

export interface Locatable {
  location?: {
    postal_code?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    country_code?: string;
  };
}

/**
 * Check if an item is in continental Spain.
 * Priority: country_code → postal code → bounding box.
 * Rejects Portugal, Italy, France, etc. via country_code.
 * Rejects Canarias, Baleares, Ceuta, Melilla via postal code.
 */
export function isInContinentalSpain(item: Locatable): boolean {
  const loc = item.location;
  if (!loc) return false;

  // Country code check — reject anything that's not Spain
  if (loc.country_code && loc.country_code !== 'ES') return false;

  // Postal code check (most reliable for islands/enclaves)
  const postal = loc.postal_code?.trim();
  if (postal && postal.length >= 2) {
    const prefix = postal.slice(0, 2);

    // Must be a valid Spanish postal code (01-52)
    const num = parseInt(prefix, 10);
    if (isNaN(num) || num < 1 || num > 52) return false;

    // Exclude non-continental
    if (NON_CONTINENTAL_PREFIXES.includes(prefix)) return false;

    return true;
  }

  // Fallback: bounding box check on coordinates
  const lat = loc.latitude;
  const lon = loc.longitude;
  if (lat != null && lon != null) {
    return (
      lat >= CONTINENTAL_BBOX.latMin &&
      lat <= CONTINENTAL_BBOX.latMax &&
      lon >= CONTINENTAL_BBOX.lonMin &&
      lon <= CONTINENTAL_BBOX.lonMax
    );
  }

  // No location data — can't determine
  return false;
}

/**
 * Filter an array of items to only continental Spain.
 */
export function filterContinentalSpain<T extends Locatable>(items: T[]): T[] {
  return items.filter(isInContinentalSpain);
}
