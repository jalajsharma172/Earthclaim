// Utility functions for managing territory claims and overlap detection
/**
 * Check if two circles overlap using the Haversine formula
 * @param circle1 First circle with lat, lng, radius
 * @param circle2 Second circle with lat, lng, radius
 * @returns true if circles overlap, false otherwise
 */
export function checkOverlap(circle1, circle2) {
    const distance = calculateDistance(circle1.lat, circle1.lng, circle2.lat, circle2.lng);
    const minDistance = circle1.radius + circle2.radius;
    return distance < minDistance;
}
/**
 * Calculate the distance between two points using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lng1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lng2 Longitude of second point
 * @returns Distance in meters
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
/**
 * Convert degrees to radians
 * @param degrees Degrees to convert
 * @returns Radians
 */
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}
/**
 * Calculate the area of a circle
 * @param radius Radius in meters
 * @returns Area in square meters
 */
export function calculateCircleArea(radius) {
    return Math.PI * radius * radius;
}
/**
 * Check if a claim is valid (doesn't overlap with existing claims)
 * @param newClaim The new claim to check
 * @param existingClaims Array of existing claims
 * @returns Object with validity status and message
 */
export function validateClaim(newClaim, existingClaims) {
    for (const existingClaim of existingClaims) {
        if (checkOverlap(newClaim, existingClaim)) {
            const distance = calculateDistance(newClaim.lat, newClaim.lng, existingClaim.lat, existingClaim.lng);
            return {
                isValid: false,
                message: `This area overlaps with an existing claim (${Math.round(distance)}m away)`
            };
        }
    }
    return {
        isValid: true,
        message: "Area is available for claiming"
    };
}
/**
 * Get the optimal claiming radius based on GPS accuracy
 * @param accuracy GPS accuracy in meters
 * @returns Recommended radius in meters
 */
export function getOptimalRadius(accuracy) {
    // Base radius is 100m, but adjust based on GPS accuracy
    const baseRadius = 100;
    if (accuracy <= 5) {
        return baseRadius; // High accuracy, use full radius
    }
    else if (accuracy <= 10) {
        return Math.max(baseRadius * 0.8, 50); // Good accuracy, slightly reduce
    }
    else if (accuracy <= 20) {
        return Math.max(baseRadius * 0.6, 30); // Fair accuracy, reduce more
    }
    else {
        return Math.max(baseRadius * 0.4, 20); // Poor accuracy, minimum radius
    }
}
/**
 * Format area for display
 * @param area Area in square meters
 * @returns Formatted string
 */
export function formatArea(area) {
    if (area >= 1000000) {
        return `${(area / 1000000).toFixed(1)} km²`;
    }
    else if (area >= 1000) {
        return `${(area / 1000).toFixed(1)} k m²`;
    }
    else {
        return `${Math.round(area)} m²`;
    }
}
/**
 * Calculate total area from multiple claims
 * @param claims Array of claims with area property
 * @returns Total area in square meters
 */
export function calculateTotalArea(claims) {
    return claims.reduce((total, claim) => total + claim.area, 0);
}
