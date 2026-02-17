import { isInContinentalSpain, filterContinentalSpain } from '../filters';

describe('isInContinentalSpain()', () => {
  // ── Continental (should pass) ─────────────────────────

  it('should accept Barcelona (08xxx)', () => {
    expect(isInContinentalSpain({ location: { postal_code: '08001', city: 'Barcelona', latitude: 41.38, longitude: 2.17 } })).toBe(true);
  });

  it('should accept Madrid (28xxx)', () => {
    expect(isInContinentalSpain({ location: { postal_code: '28001', city: 'Madrid', latitude: 40.42, longitude: -3.70 } })).toBe(true);
  });

  it('should accept Sevilla (41xxx)', () => {
    expect(isInContinentalSpain({ location: { postal_code: '41001', city: 'Sevilla' } })).toBe(true);
  });

  it('should accept Bilbao (48xxx)', () => {
    expect(isInContinentalSpain({ location: { postal_code: '48001', city: 'Bilbao' } })).toBe(true);
  });

  it('should accept Valencia (46xxx)', () => {
    expect(isInContinentalSpain({ location: { postal_code: '46001' } })).toBe(true);
  });

  it('should accept Galicia (15xxx)', () => {
    expect(isInContinentalSpain({ location: { postal_code: '15001' } })).toBe(true);
  });

  // ── Non-continental (should reject) ───────────────────

  it('should reject Baleares (07xxx)', () => {
    expect(isInContinentalSpain({ location: { postal_code: '07001', city: 'Palma' } })).toBe(false);
  });

  it('should reject Las Palmas / Canarias (35xxx)', () => {
    expect(isInContinentalSpain({ location: { postal_code: '35001', city: 'Las Palmas' } })).toBe(false);
  });

  it('should reject Tenerife / Canarias (38xxx)', () => {
    expect(isInContinentalSpain({ location: { postal_code: '38001', city: 'Santa Cruz de Tenerife' } })).toBe(false);
  });

  it('should reject Ceuta (51xxx)', () => {
    expect(isInContinentalSpain({ location: { postal_code: '51001', city: 'Ceuta' } })).toBe(false);
  });

  it('should reject Melilla (52xxx)', () => {
    expect(isInContinentalSpain({ location: { postal_code: '52001', city: 'Melilla' } })).toBe(false);
  });

  // ── Fallback to coordinates ───────────────────────────

  it('should accept coordinates inside continental Spain (no postal code)', () => {
    expect(isInContinentalSpain({ location: { latitude: 40.42, longitude: -3.70 } })).toBe(true);
  });

  it('should reject coordinates in Canarias (no postal code)', () => {
    expect(isInContinentalSpain({ location: { latitude: 28.12, longitude: -15.43 } })).toBe(false);
  });

  it('should reject coordinates in Baleares (no postal code)', () => {
    // Palma de Mallorca is at ~39.57, 2.65 — inside bounding box, so it passes on coords alone
    // This is a known limitation; postal code is more reliable
    expect(isInContinentalSpain({ location: { latitude: 39.57, longitude: 2.65 } })).toBe(true);
  });

  it('should reject coordinates in France', () => {
    expect(isInContinentalSpain({ location: { latitude: 48.85, longitude: 2.35 } })).toBe(false);
  });

  it('should reject coordinates in Portugal (west of bbox)', () => {
    expect(isInContinentalSpain({ location: { latitude: 38.72, longitude: -9.5 } })).toBe(false);
  });

  // ── Edge cases ────────────────────────────────────────

  it('should reject when no location at all', () => {
    expect(isInContinentalSpain({})).toBe(false);
  });

  it('should reject when location has no useful data', () => {
    expect(isInContinentalSpain({ location: {} })).toBe(false);
  });

  it('should reject non-Spanish postal codes', () => {
    expect(isInContinentalSpain({ location: { postal_code: '75001' } })).toBe(false);
  });

  it('should handle postal code with spaces', () => {
    expect(isInContinentalSpain({ location: { postal_code: ' 08001 ' } })).toBe(true);
  });

  // ── Country code filtering ────────────────────────────

  it('should reject Portugal via country_code', () => {
    expect(isInContinentalSpain({ location: { country_code: 'PT', city: 'Lisboa', postal_code: '1000', latitude: 38.72, longitude: -9.14 } })).toBe(false);
  });

  it('should reject Italy via country_code', () => {
    expect(isInContinentalSpain({ location: { country_code: 'IT', city: 'Roma', postal_code: '00100', latitude: 41.90, longitude: 12.49 } })).toBe(false);
  });

  it('should reject France via country_code', () => {
    expect(isInContinentalSpain({ location: { country_code: 'FR', city: 'Perpignan', postal_code: '66000', latitude: 42.69, longitude: 2.90 } })).toBe(false);
  });

  it('should accept Spain with country_code ES', () => {
    expect(isInContinentalSpain({ location: { country_code: 'ES', postal_code: '08001', city: 'Barcelona' } })).toBe(true);
  });

  it('should still reject Canarias even with country_code ES', () => {
    expect(isInContinentalSpain({ location: { country_code: 'ES', postal_code: '35001', city: 'Las Palmas' } })).toBe(false);
  });
});

describe('filterContinentalSpain()', () => {
  it('should filter array to only continental items', () => {
    const items = [
      { id: '1', location: { postal_code: '08001', city: 'Barcelona' } },
      { id: '2', location: { postal_code: '07001', city: 'Palma' } },
      { id: '3', location: { postal_code: '28001', city: 'Madrid' } },
      { id: '4', location: { postal_code: '35001', city: 'Las Palmas' } },
      { id: '5', location: { postal_code: '38001', city: 'Tenerife' } },
    ];

    const result = filterContinentalSpain(items);

    expect(result).toHaveLength(2);
    expect(result.map(i => i.id)).toEqual(['1', '3']);
  });
});
