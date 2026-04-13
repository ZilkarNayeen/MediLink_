/**
 * Utility to fetch [lat, lng] from a city name using OpenStreetMap Nominatim.
 * Nominatim requires a User-Agent and has rate limits (1 request/sec).
 * We implement a basic in-memory cache to avoid redundant network calls.
 */

const cache = new Map()

export async function geocodeCity(city) {
  if (!city) return null
  
  const normalized = city.trim().toLowerCase()
  if (cache.has(normalized)) {
    return cache.get(normalized)
  }

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(normalized)}&format=json&limit=1`, {
      headers: {
        'Accept-Language': 'en'
      }
    })
    
    if (!res.ok) throw new Error('Geocoding failed')
    
    const data = await res.json()
    if (data && data.length > 0) {
      const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)]
      cache.set(normalized, coords)
      return coords
    }
  } catch (error) {
    console.warn(`Failed to geocode city: ${city}`, error)
  }

  return null
}
