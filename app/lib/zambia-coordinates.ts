// GPS Coordinates for all major Zambian cities and bus stations
// Used for ETA calculation, geofencing, and route mapping

export interface CityCoordinate {
  name: string;
  province: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  has_bus_station: boolean;
  station_name?: string;
}

export interface RouteSegment {
  from: string;
  to: string;
  distance_km: number;
  typical_duration_minutes: number;
  road_quality: 'excellent' | 'good' | 'fair' | 'poor';
  road_name?: string;
  waypoints?: { lat: number; lng: number }[];
}

// Comprehensive GPS coordinates for Zambian cities
export const zambianCityCoordinates: CityCoordinate[] = [
  // Capital & Major Cities
  { name: 'Lusaka', province: 'Lusaka', latitude: -15.3875, longitude: 28.3228, elevation_m: 1279, has_bus_station: true, station_name: 'Lusaka Intercity Bus Terminal' },
  { name: 'Kitwe', province: 'Copperbelt', latitude: -12.8024, longitude: 28.2132, elevation_m: 1295, has_bus_station: true, station_name: 'Kitwe Bus Station' },
  { name: 'Ndola', province: 'Copperbelt', latitude: -12.9587, longitude: 28.6366, elevation_m: 1270, has_bus_station: true, station_name: 'Ndola Bus Terminal' },
  { name: 'Kabwe', province: 'Central', latitude: -14.4378, longitude: 28.4514, elevation_m: 1182, has_bus_station: true, station_name: 'Kabwe Bus Station' },
  { name: 'Chingola', province: 'Copperbelt', latitude: -12.5297, longitude: 27.8536, elevation_m: 1310, has_bus_station: true },
  { name: 'Mufulira', province: 'Copperbelt', latitude: -12.5415, longitude: 28.2404, elevation_m: 1260, has_bus_station: true },
  { name: 'Luanshya', province: 'Copperbelt', latitude: -13.1367, longitude: 28.4166, elevation_m: 1250, has_bus_station: true },
  { name: 'Livingstone', province: 'Southern', latitude: -17.8419, longitude: 25.8544, elevation_m: 986, has_bus_station: true, station_name: 'Livingstone Bus Terminal' },
  { name: 'Kasama', province: 'Northern', latitude: -10.2129, longitude: 31.1808, elevation_m: 1384, has_bus_station: true, station_name: 'Kasama Bus Station' },
  { name: 'Chipata', province: 'Eastern', latitude: -13.6333, longitude: 32.6500, elevation_m: 1040, has_bus_station: true, station_name: 'Chipata Bus Terminal' },

  // Provincial Capitals
  { name: 'Solwezi', province: 'North-Western', latitude: -12.1667, longitude: 25.8667, elevation_m: 1400, has_bus_station: true, station_name: 'Solwezi Bus Station' },
  { name: 'Mansa', province: 'Luapula', latitude: -11.1997, longitude: 28.8942, elevation_m: 1260, has_bus_station: true, station_name: 'Mansa Bus Station' },
  { name: 'Mongu', province: 'Western', latitude: -15.2547, longitude: 23.1522, elevation_m: 1050, has_bus_station: true, station_name: 'Mongu Bus Station' },

  // Important Towns
  { name: 'Choma', province: 'Southern', latitude: -16.5414, longitude: 26.9744, elevation_m: 1280, has_bus_station: true },
  { name: 'Mazabuka', province: 'Southern', latitude: -15.8560, longitude: 27.7480, elevation_m: 1020, has_bus_station: true },
  { name: 'Kafue', province: 'Lusaka', latitude: -15.7694, longitude: 28.1814, elevation_m: 990, has_bus_station: true },
  { name: 'Kapiri Mposhi', province: 'Central', latitude: -14.9714, longitude: 28.6828, elevation_m: 1160, has_bus_station: true, station_name: 'Kapiri Mposhi Junction' },
  { name: 'Chililabombwe', province: 'Copperbelt', latitude: -12.3667, longitude: 27.8167, elevation_m: 1300, has_bus_station: false },
  { name: 'Kalulushi', province: 'Copperbelt', latitude: -12.8406, longitude: 28.0944, elevation_m: 1280, has_bus_station: false },
  { name: 'Mpika', province: 'Muchinga', latitude: -11.8333, longitude: 31.4500, elevation_m: 1400, has_bus_station: true },
  { name: 'Nakonde', province: 'Muchinga', latitude: -9.3500, longitude: 32.7500, elevation_m: 1500, has_bus_station: true },
  { name: 'Mbala', province: 'Northern', latitude: -8.8333, longitude: 31.3667, elevation_m: 1660, has_bus_station: true },
  { name: 'Mpulungu', province: 'Northern', latitude: -8.7667, longitude: 31.1167, elevation_m: 780, has_bus_station: true },
  { name: 'Kawambwa', province: 'Luapula', latitude: -9.7917, longitude: 29.0792, elevation_m: 1280, has_bus_station: false },
  { name: 'Nchelenge', province: 'Luapula', latitude: -9.3500, longitude: 28.7333, elevation_m: 940, has_bus_station: false },
  { name: 'Mwinilunga', province: 'North-Western', latitude: -11.7333, longitude: 25.2667, elevation_m: 1360, has_bus_station: false },
  { name: 'Zambezi', province: 'North-Western', latitude: -13.5333, longitude: 23.1000, elevation_m: 1080, has_bus_station: false },
  { name: 'Kaoma', province: 'Western', latitude: -14.7833, longitude: 24.8000, elevation_m: 1120, has_bus_station: true },
  { name: 'Senanga', province: 'Western', latitude: -15.9833, longitude: 23.2667, elevation_m: 1020, has_bus_station: false },
  { name: 'Sesheke', province: 'Western', latitude: -17.4667, longitude: 25.2667, elevation_m: 950, has_bus_station: true },
  { name: 'Kazungula', province: 'Southern', latitude: -17.7833, longitude: 25.2667, elevation_m: 940, has_bus_station: false },
  { name: 'Kalomo', province: 'Southern', latitude: -17.0333, longitude: 26.4833, elevation_m: 1350, has_bus_station: true },
  { name: 'Namwala', province: 'Southern', latitude: -15.7500, longitude: 26.4333, elevation_m: 1000, has_bus_station: false },
  { name: 'Monze', province: 'Southern', latitude: -16.2833, longitude: 27.4833, elevation_m: 1100, has_bus_station: true },
  { name: 'Siavonga', province: 'Southern', latitude: -16.5333, longitude: 28.7167, elevation_m: 530, has_bus_station: false },
  { name: 'Petauke', province: 'Eastern', latitude: -14.2333, longitude: 31.3167, elevation_m: 1040, has_bus_station: true },
  { name: 'Katete', province: 'Eastern', latitude: -14.1167, longitude: 31.9667, elevation_m: 1050, has_bus_station: true },
  { name: 'Lundazi', province: 'Eastern', latitude: -12.2833, longitude: 33.1833, elevation_m: 1200, has_bus_station: true },
  { name: 'Chama', province: 'Muchinga', latitude: -11.2167, longitude: 33.1500, elevation_m: 1300, has_bus_station: false },
  { name: 'Isoka', province: 'Muchinga', latitude: -10.1167, longitude: 32.6333, elevation_m: 1400, has_bus_station: false },
  { name: 'Serenje', province: 'Central', latitude: -13.2333, longitude: 30.2167, elevation_m: 1400, has_bus_station: true },
  { name: 'Mkushi', province: 'Central', latitude: -13.6167, longitude: 29.3833, elevation_m: 1200, has_bus_station: true },
  { name: 'Mumbwa', province: 'Central', latitude: -14.9833, longitude: 27.0667, elevation_m: 1200, has_bus_station: true },
];

// Major route segments with road quality data
// Used for ETA calculation and route planning
export const routeSegments: RouteSegment[] = [
  // T2 Highway: Lusaka — Copperbelt (Great North Road)
  { from: 'Lusaka', to: 'Kabwe', distance_km: 139, typical_duration_minutes: 120, road_quality: 'good', road_name: 'T2 Great North Road' },
  { from: 'Kabwe', to: 'Kapiri Mposhi', distance_km: 52, typical_duration_minutes: 45, road_quality: 'good', road_name: 'T2 Great North Road' },
  { from: 'Kapiri Mposhi', to: 'Ndola', distance_km: 178, typical_duration_minutes: 180, road_quality: 'good', road_name: 'T3 Ndola Road' },
  { from: 'Ndola', to: 'Kitwe', distance_km: 55, typical_duration_minutes: 50, road_quality: 'excellent', road_name: 'T3 Dual Carriageway' },
  { from: 'Kitwe', to: 'Chingola', distance_km: 48, typical_duration_minutes: 45, road_quality: 'good', road_name: 'T3' },
  { from: 'Kitwe', to: 'Mufulira', distance_km: 60, typical_duration_minutes: 55, road_quality: 'good', road_name: 'M6' },
  { from: 'Ndola', to: 'Luanshya', distance_km: 35, typical_duration_minutes: 35, road_quality: 'good', road_name: 'M7' },

  // T3 Highway: Lusaka — Livingstone (Southern Route)
  { from: 'Lusaka', to: 'Kafue', distance_km: 45, typical_duration_minutes: 40, road_quality: 'excellent', road_name: 'T3 Kafue Road' },
  { from: 'Kafue', to: 'Mazabuka', distance_km: 85, typical_duration_minutes: 70, road_quality: 'good', road_name: 'T3' },
  { from: 'Mazabuka', to: 'Monze', distance_km: 60, typical_duration_minutes: 55, road_quality: 'good', road_name: 'T3' },
  { from: 'Monze', to: 'Choma', distance_km: 60, typical_duration_minutes: 55, road_quality: 'good', road_name: 'T3' },
  { from: 'Choma', to: 'Kalomo', distance_km: 65, typical_duration_minutes: 60, road_quality: 'good', road_name: 'T3' },
  { from: 'Kalomo', to: 'Livingstone', distance_km: 130, typical_duration_minutes: 120, road_quality: 'good', road_name: 'T3' },

  // T4 Highway: Lusaka — Chipata (Eastern Route)
  { from: 'Lusaka', to: 'Petauke', distance_km: 370, typical_duration_minutes: 360, road_quality: 'fair', road_name: 'T4 Great East Road' },
  { from: 'Petauke', to: 'Katete', distance_km: 80, typical_duration_minutes: 75, road_quality: 'fair', road_name: 'T4' },
  { from: 'Katete', to: 'Chipata', distance_km: 100, typical_duration_minutes: 90, road_quality: 'fair', road_name: 'T4' },

  // T2 Highway: Kapiri Mposhi — Kasama (Great North Road continued)
  { from: 'Kapiri Mposhi', to: 'Serenje', distance_km: 260, typical_duration_minutes: 270, road_quality: 'fair', road_name: 'T2 Great North Road' },
  { from: 'Serenje', to: 'Mpika', distance_km: 170, typical_duration_minutes: 180, road_quality: 'fair', road_name: 'T2' },
  { from: 'Mpika', to: 'Kasama', distance_km: 350, typical_duration_minutes: 360, road_quality: 'fair', road_name: 'T2' },
  { from: 'Kasama', to: 'Mbala', distance_km: 150, typical_duration_minutes: 150, road_quality: 'fair', road_name: 'M3' },
  { from: 'Mbala', to: 'Mpulungu', distance_km: 30, typical_duration_minutes: 35, road_quality: 'fair', road_name: 'M3' },
  { from: 'Kasama', to: 'Nakonde', distance_km: 320, typical_duration_minutes: 330, road_quality: 'fair', road_name: 'T2' },

  // T5 Highway: Kapiri Mposhi — Solwezi (North-Western Route)
  { from: 'Kapiri Mposhi', to: 'Mkushi', distance_km: 120, typical_duration_minutes: 110, road_quality: 'good', road_name: 'T2' },
  { from: 'Ndola', to: 'Solwezi', distance_km: 380, typical_duration_minutes: 360, road_quality: 'fair', road_name: 'T5' },
  { from: 'Chingola', to: 'Solwezi', distance_km: 200, typical_duration_minutes: 210, road_quality: 'fair', road_name: 'T5' },

  // M10: Lusaka — Mongu (Western Route)
  { from: 'Lusaka', to: 'Mumbwa', distance_km: 150, typical_duration_minutes: 150, road_quality: 'fair', road_name: 'M9' },
  { from: 'Mumbwa', to: 'Kaoma', distance_km: 200, typical_duration_minutes: 210, road_quality: 'fair', road_name: 'M9' },
  { from: 'Kaoma', to: 'Mongu', distance_km: 230, typical_duration_minutes: 240, road_quality: 'poor', road_name: 'M10' },

  // Southern connections
  { from: 'Livingstone', to: 'Kazungula', distance_km: 70, typical_duration_minutes: 75, road_quality: 'good', road_name: 'T3' },
  { from: 'Livingstone', to: 'Sesheke', distance_km: 200, typical_duration_minutes: 210, road_quality: 'fair', road_name: 'M10' },

  // Luapula connections
  { from: 'Serenje', to: 'Mansa', distance_km: 350, typical_duration_minutes: 360, road_quality: 'poor', road_name: 'M3' },
  { from: 'Mansa', to: 'Nchelenge', distance_km: 200, typical_duration_minutes: 240, road_quality: 'poor', road_name: 'M3' },

  // Eastern connections
  { from: 'Chipata', to: 'Lundazi', distance_km: 120, typical_duration_minutes: 130, road_quality: 'fair', road_name: 'D104' },
  { from: 'Mpika', to: 'Chama', distance_km: 250, typical_duration_minutes: 300, road_quality: 'poor', road_name: 'D104' },
];

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Find the nearest city to a GPS coordinate
 */
export function findNearestCity(latitude: number, longitude: number): {
  city: CityCoordinate;
  distance_km: number;
} {
  let nearest = zambianCityCoordinates[0];
  let minDistance = Infinity;

  for (const city of zambianCityCoordinates) {
    const dist = calculateDistance(latitude, longitude, city.latitude, city.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = city;
    }
  }

  return { city: nearest, distance_km: Math.round(minDistance * 10) / 10 };
}

/**
 * Get coordinates for a city by name
 */
export function getCityCoordinates(cityName: string): CityCoordinate | undefined {
  return zambianCityCoordinates.find(
    c => c.name.toLowerCase() === cityName.toLowerCase()
  );
}

/**
 * Find route segments between two cities
 * Returns ordered array of segments forming the path
 */
export function findRouteSegments(origin: string, destination: string): RouteSegment[] {
  // Direct route check
  const direct = routeSegments.find(
    s => (s.from === origin && s.to === destination) ||
         (s.from === destination && s.to === origin)
  );
  if (direct) return [direct];

  // BFS pathfinding for multi-segment routes
  const graph = buildRouteGraph();
  const visited = new Set<string>();
  const queue: { city: string; path: RouteSegment[] }[] = [{ city: origin, path: [] }];
  visited.add(origin);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = graph.get(current.city) || [];

    for (const { neighbor, segment } of neighbors) {
      if (visited.has(neighbor)) continue;
      
      const newPath = [...current.path, segment];
      
      if (neighbor === destination) {
        return newPath;
      }

      visited.add(neighbor);
      queue.push({ city: neighbor, path: newPath });
    }
  }

  return []; // No route found
}

/**
 * Build adjacency graph from route segments
 */
function buildRouteGraph(): Map<string, { neighbor: string; segment: RouteSegment }[]> {
  const graph = new Map<string, { neighbor: string; segment: RouteSegment }[]>();

  for (const segment of routeSegments) {
    // Add forward direction
    if (!graph.has(segment.from)) graph.set(segment.from, []);
    graph.get(segment.from)!.push({ neighbor: segment.to, segment });

    // Add reverse direction
    if (!graph.has(segment.to)) graph.set(segment.to, []);
    graph.get(segment.to)!.push({ neighbor: segment.from, segment });
  }

  return graph;
}

/**
 * Calculate total route distance and estimated duration
 */
export function calculateRouteMetrics(origin: string, destination: string): {
  total_distance_km: number;
  estimated_duration_minutes: number;
  segments: RouteSegment[];
  stops: string[];
} | null {
  const segments = findRouteSegments(origin, destination);
  if (segments.length === 0) return null;

  let total_distance = 0;
  let total_duration = 0;
  const stops: string[] = [origin];

  for (const seg of segments) {
    total_distance += seg.distance_km;
    total_duration += seg.typical_duration_minutes;
    const nextStop = seg.from === stops[stops.length - 1] ? seg.to : seg.from;
    stops.push(nextStop);
  }

  return {
    total_distance_km: total_distance,
    estimated_duration_minutes: total_duration,
    segments,
    stops,
  };
}

/**
 * Check if a GPS point is within a geofence radius
 */
export function isWithinGeofence(
  pointLat: number, pointLon: number,
  fenceLat: number, fenceLon: number,
  radiusKm: number
): boolean {
  const distance = calculateDistance(pointLat, pointLon, fenceLat, fenceLon);
  return distance <= radiusKm;
}

/**
 * Calculate bearing between two points (for heading)
 */
export function calculateBearing(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const dLon = toRadians(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRadians(lat2));
  const x = Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) -
            Math.sin(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(dLon);
  let bearing = Math.atan2(y, x) * (180 / Math.PI);
  return (bearing + 360) % 360;
}

/**
 * Estimate progress along a route based on current position
 * Returns percentage (0-100)
 */
export function estimateRouteProgress(
  currentLat: number, currentLon: number,
  origin: string, destination: string
): number {
  const originCoords = getCityCoordinates(origin);
  const destCoords = getCityCoordinates(destination);
  if (!originCoords || !destCoords) return 0;

  const totalDistance = calculateDistance(
    originCoords.latitude, originCoords.longitude,
    destCoords.latitude, destCoords.longitude
  );

  const distanceFromOrigin = calculateDistance(
    originCoords.latitude, originCoords.longitude,
    currentLat, currentLon
  );

  const progress = (distanceFromOrigin / totalDistance) * 100;
  return Math.min(Math.max(Math.round(progress), 0), 100);
}