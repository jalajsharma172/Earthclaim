// Geometry utility functions for path tracking and intersection detection
/**
 * Calculate the area of a polygon using the shoelace formula
 */
export function calculatePolygonArea(points) {
    if (points.length < 3)
        return 0;
    // Convert to meters using a simple approximation
    const metersPerDegree = 111320; // approximate meters per degree at equator
    let area = 0;
    for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        const xi = points[i].lng * metersPerDegree * Math.cos(toRadians(points[i].lat));
        const yi = points[i].lat * metersPerDegree;
        const xj = points[j].lng * metersPerDegree * Math.cos(toRadians(points[j].lat));
        const yj = points[j].lat * metersPerDegree;
        area += xi * yj;
        area -= xj * yi;
    }
    return Math.abs(area) / 2;
}
/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(point1, point2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = toRadians(point2.lat - point1.lat);
    const dLng = toRadians(point2.lng - point1.lng);
    const lat1 = toRadians(point1.lat);
    const lat2 = toRadians(point2.lat);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
/**
 * Calculate total path length from array of points
 */
export function calculatePathLength(points) {
    if (points.length < 2)
        return 0;
    let totalLength = 0;
    for (let i = 1; i < points.length; i++) {
        totalLength += calculateDistance(points[i - 1], points[i]);
    }
    return totalLength;
}
/**
 * Calculate claimed area using the formula: Area = (distance * 2 * r) + (π * r²)
 * This includes both the path area (rectangle) and circular end caps
 */
export function calculateClaimedArea(pathLength, radius = 10) {
    // Area = (distance * 2 * r) + (π * r²)
    // Where distance is path length, r is radius (10m)
    const rectangularArea = pathLength * 2 * radius; // Path corridor area
    const circularArea = Math.PI * radius * radius; // End caps area
    return rectangularArea + circularArea;
}
/**
 * Legacy function for backward compatibility - now uses the new formula
 */
export function calculatePathArea(pathLength, width = 10) {
    // Convert width to radius for the new formula
    const radius = width / 2;
    return calculateClaimedArea(pathLength, radius);
}
/**
 * Check if two line segments intersect
 */
export function lineSegmentsIntersect(p1, p2, p3, p4) {
    const d1 = direction(p3, p4, p1);
    const d2 = direction(p3, p4, p2);
    const d3 = direction(p1, p2, p3);
    const d4 = direction(p1, p2, p4);
    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
        ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
        return true;
    }
    return false;
}
/**
 * Find self-intersections in a path and create circles
 */
export function findPathIntersections(points) {
    const intersections = [];
    if (points.length < 4)
        return intersections;
    // Check each segment against all other non-adjacent segments
    for (let i = 0; i < points.length - 1; i++) {
        for (let j = i + 2; j < points.length - 1; j++) {
            // Skip adjacent segments
            if (j === i + 1)
                continue;
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[j];
            const p4 = points[j + 1];
            if (lineSegmentsIntersect(p1, p2, p3, p4)) {
                const intersection = getLineIntersection(p1, p2, p3, p4);
                if (intersection) {
                    // Extract the circular path between intersections
                    const circlePoints = points.slice(i + 1, j + 1);
                    circlePoints.unshift(intersection);
                    circlePoints.push(intersection);
                    const area = calculatePolygonArea(circlePoints);
                    intersections.push({
                        intersection,
                        circlePoints,
                        area
                    });
                }
            }
        }
    }
    return intersections;
}
/**
 * Get intersection point of two line segments
 */
function getLineIntersection(p1, p2, p3, p4) {
    const x1 = p1.lng, y1 = p1.lat;
    const x2 = p2.lng, y2 = p2.lat;
    const x3 = p3.lng, y3 = p3.lat;
    const x4 = p4.lng, y4 = p4.lat;
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 1e-10)
        return null; // Lines are parallel
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        return {
            lng: x1 + t * (x2 - x1),
            lat: y1 + t * (y2 - y1)
        };
    }
    return null;
}
/**
 * Calculate direction of point c relative to line ab
 */
function direction(a, b, c) {
    return (c.lng - a.lng) * (b.lat - a.lat) - (b.lng - a.lng) * (c.lat - a.lat);
}
/**
 * Convert degrees to radians
 */
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}
/**
 * Convert radians to degrees
 */
function toDegrees(radians) {
    return radians * (180 / Math.PI);
}
