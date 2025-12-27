// Geographic utility functions for location-based operations
/**
 * Convert GPS coordinates to a simplified location identifier
 * This is a simplified version - in production you'd use a reverse geocoding service
 * @param coords GPS coordinates
 * @returns Location information object
 */
export function getLocationInfo(coords) {
    // Simplified location mapping based on coordinate ranges
    // In a real app, you'd use a service like Nominatim, Google Geocoding, etc.
    const { latitude, longitude } = coords;
    // Generate simplified district/city names based on coordinate grids
    const districtId = Math.floor((latitude + 90) * 10) % 100;
    const cityId = Math.floor((longitude + 180) * 10) % 100;
    return {
        district: `District_${districtId.toString().padStart(2, '0')}`,
        city: `City_${cityId.toString().padStart(2, '0')}`,
        country: getCountryFromCoords(latitude, longitude),
        region: getRegionFromCoords(latitude, longitude),
    };
}
/**
 * Get approximate country from coordinates
 * This is a very simplified version - real implementation would use proper country boundaries
 * @param lat Latitude
 * @param lng Longitude
 * @returns Country name
 */
function getCountryFromCoords(lat, lng) {
    // Simplified country detection based on rough coordinate ranges
    if (lat >= 24 && lat <= 50 && lng >= -125 && lng <= -66) {
        return 'United States';
    }
    else if (lat >= 42 && lat <= 83 && lng >= -141 && lng <= -52) {
        return 'Canada';
    }
    else if (lat >= 35 && lat <= 72 && lng >= -10 && lng <= 40) {
        return 'Europe';
    }
    else if (lat >= -55 && lat <= 37 && lng >= -20 && lng <= 55) {
        return 'Africa';
    }
    else if (lat >= -50 && lat <= 81 && lng >= 26 && lng <= 180) {
        return 'Asia';
    }
    else if (lat >= -47 && lat <= -9 && lng >= 113 && lng <= 154) {
        return 'Australia';
    }
    else {
        return 'Unknown';
    }
}
/**
 * Get approximate region from coordinates
 * @param lat Latitude
 * @param lng Longitude
 * @returns Region name
 */
function getRegionFromCoords(lat, lng) {
    if (lat >= 0) {
        return 'Northern Hemisphere';
    }
    else {
        return 'Southern Hemisphere';
    }
}
/**
 * Check if coordinates are within a valid range
 * @param coords Coordinates to validate
 * @returns true if valid, false otherwise
 */
export function validateCoordinates(coords) {
    const { latitude, longitude } = coords;
    return (latitude >= -90 && latitude <= 90 &&
        longitude >= -180 && longitude <= 180);
}
/**
 * Format coordinates for display
 * @param coords Coordinates to format
 * @param precision Number of decimal places
 * @returns Formatted coordinate string
 */
export function formatCoordinates(coords, precision = 6) {
    const { latitude, longitude } = coords;
    const latStr = latitude.toFixed(precision);
    const lngStr = longitude.toFixed(precision);
    const latDir = latitude >= 0 ? 'N' : 'S';
    const lngDir = longitude >= 0 ? 'E' : 'W';
    return `${Math.abs(parseFloat(latStr))}°${latDir}, ${Math.abs(parseFloat(lngStr))}°${lngDir}`;
}
/**
 * Calculate the bounding box for a given center point and radius
 * @param center Center coordinates
 * @param radiusMeters Radius in meters
 * @returns Bounding box coordinates
 */
export function getBoundingBox(center, radiusMeters) {
    const { latitude, longitude } = center;
    // Rough conversion: 1 degree latitude ≈ 111,000 meters
    // 1 degree longitude ≈ 111,000 * cos(latitude) meters
    const latOffset = radiusMeters / 111000;
    const lngOffset = radiusMeters / (111000 * Math.cos(latitude * Math.PI / 180));
    return {
        north: latitude + latOffset,
        south: latitude - latOffset,
        east: longitude + lngOffset,
        west: longitude - lngOffset,
    };
}
/**
 * Check if a point is within a circular area
 * @param point Point to check
 * @param center Center of the circle
 * @param radiusMeters Radius in meters
 * @returns true if point is within the circle
 */
export function isPointInCircle(point, center, radiusMeters) {
    const distance = calculateDistanceBetweenPoints(point, center);
    return distance <= radiusMeters;
}
/**
 * Calculate distance between two points using Haversine formula
 * @param point1 First point
 * @param point2 Second point
 * @returns Distance in meters
 */
export function calculateDistanceBetweenPoints(point1, point2) {
    const R = 6371000; // Earth's radius in meters
    const lat1Rad = point1.latitude * Math.PI / 180;
    const lat2Rad = point2.latitude * Math.PI / 180;
    const deltaLatRad = (point2.latitude - point1.latitude) * Math.PI / 180;
    const deltaLngRad = (point2.longitude - point1.longitude) * Math.PI / 180;
    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
/**
 * Get compass bearing between two points
 * @param start Starting point
 * @param end Ending point
 * @returns Bearing in degrees (0-360)
 */
export function getBearing(start, end) {
    const lat1Rad = start.latitude * Math.PI / 180;
    const lat2Rad = end.latitude * Math.PI / 180;
    const deltaLngRad = (end.longitude - start.longitude) * Math.PI / 180;
    const y = Math.sin(deltaLngRad) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
        Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLngRad);
    const bearingRad = Math.atan2(y, x);
    const bearingDeg = (bearingRad * 180 / Math.PI + 360) % 360;
    return bearingDeg;
}
/**
 * Generate a random point within a given radius from a center point
 * Useful for testing or demo purposes
 * @param center Center coordinates
 * @param maxRadiusMeters Maximum radius in meters
 * @returns Random coordinates within the radius
 */
export function generateRandomPointInRadius(center, maxRadiusMeters) {
    const radiusInDegrees = maxRadiusMeters / 111000;
    const u = Math.random();
    const v = Math.random();
    const w = radiusInDegrees * Math.sqrt(u);
    const t = 2 * Math.PI * v;
    const x = w * Math.cos(t);
    const y = w * Math.sin(t);
    return {
        latitude: center.latitude + x,
        longitude: center.longitude + y / Math.cos(center.latitude * Math.PI / 180),
    };
}
