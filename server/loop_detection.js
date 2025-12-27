export const detectClosedLoopsHandler = async (req, res) => {
    try {
        const userpath = req.body.userpath;
        const tolerance = req.body.tolerance || 50.0; // meters
        console.log("Server side loop detection - Points:", userpath?.length);
        if (!Array.isArray(userpath) || userpath.length < 4) {
            return res.status(400).json({
                closed_loops: false,
                error: "Invalid userpath - need at least 4 points"
            });
        }
        const detectionResult = detectLoops(userpath, tolerance);
        console.log("Loop detection result:", detectionResult);
        res.json(detectionResult);
    }
    catch (error) {
        console.error("Loop detection error:", error);
        res.status(500).json({
            closed_loops: false,
            error: "Internal server error"
        });
    }
};
// Haversine distance calculation (meters)
const calculateDistance = (point1, point2) => {
    const R = 6371000; // Earth radius in meters
    const lat1 = point1.lat * Math.PI / 180;
    const lat2 = point2.lat * Math.PI / 180;
    const deltaLat = (point2.lat - point1.lat) * Math.PI / 180;
    const deltaLon = (point2.lon - point1.lon) * Math.PI / 180;
    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
// Main loop detection algorithm
const detectLoops = (path, tolerance) => {
    const startPoint = path[0];
    const currentPoint = path[path.length - 1];
    // Calculate distance from start to current position
    const distanceFromStart = calculateDistance(startPoint, currentPoint);
    // Simple closure detection - check if we're close to start
    if (distanceFromStart <= tolerance && path.length > 20) {
        return {
            closed_loops: true,
            closure_point: currentPoint,
            start_point: startPoint,
            distance: distanceFromStart,
            loop_points: path,
            confidence: Math.max(0.1, 1 - (distanceFromStart / tolerance))
        };
    }
    // Advanced: Check for intersections in the path
    const intersectionResult = checkPathIntersections(path, tolerance);
    if (intersectionResult.intersected) {
        return {
            closed_loops: true,
            closure_point: intersectionResult.intersectionPoint,
            start_point: intersectionResult.startPoint,
            distance: intersectionResult.distance,
            loop_points: intersectionResult.loopPoints,
            confidence: intersectionResult.confidence
        };
    }
    return {
        closed_loops: false,
        confidence: 0
    };
};
// Check if path intersects with itself (more advanced detection)
const checkPathIntersections = (path, tolerance) => {
    const result = {
        intersected: false,
        intersectionPoint: null,
        startPoint: null,
        distance: 0,
        loopPoints: [],
        confidence: 0
    };
    // Skip recent points to avoid false positives
    const skipRecent = Math.min(15, Math.floor(path.length * 0.3));
    for (let i = 0; i < path.length - skipRecent - 1; i++) {
        for (let j = i + skipRecent; j < path.length - 1; j++) {
            const segment1 = { start: path[i], end: path[i + 1] };
            const segment2 = { start: path[j], end: path[j + 1] };
            const intersection = checkSegmentIntersection(segment1, segment2, tolerance);
            if (intersection.intersects) {
                result.intersected = true;
                result.intersectionPoint = intersection.point;
                result.startPoint = path[i];
                result.distance = intersection.distance;
                result.loopPoints = path.slice(i, j + 2);
                result.confidence = Math.max(0.1, 1 - (intersection.distance / tolerance));
                return result;
            }
        }
    }
    return result;
};
// Check if two line segments intersect
const checkSegmentIntersection = (seg1, seg2, tolerance) => {
    const result = {
        intersects: false,
        point: null,
        distance: 0
    };
    // Simple distance-based intersection check
    const distance = calculateDistance(seg1.end, seg2.start);
    if (distance <= tolerance) {
        result.intersects = true;
        result.point = {
            lat: (seg1.end.lat + seg2.start.lat) / 2,
            lon: (seg1.end.lon + seg2.start.lon) / 2
        };
        result.distance = distance;
    }
    return result;
};
