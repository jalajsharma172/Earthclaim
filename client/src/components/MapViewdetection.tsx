
import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from "react-router-dom";

interface PathPoint {
  lat: number;
  lon: number;
  timestamp: number;
}

interface LoopDetectionResult {
  isLoopClosed: boolean;
  closestPointIndex: number;
  distanceToClosest: number;
  loopClosurePoint?: PathPoint;
}

function MapView() {
  const navigate = useNavigate();
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const pathPolylineRef = useRef<L.Polyline | null>(null);
  const loopDetectionCircleRef = useRef<L.Circle | null>(null);
  
  const [userPath, setUserPath] = useState<PathPoint[]>([]);
  const [position, setPosition] = useState<{ lat: number; lon: number; acc: number }>({ 
    lat: 0, 
    lon: 0, 
    acc: 0 
  });
  const [isTracking, setIsTracking] = useState(true);
  const [isLoopClosed, setIsLoopClosed] = useState(false);
  const [loopClosurePoint, setLoopClosurePoint] = useState<PathPoint | null>(null);
  const [detectionStats, setDetectionStats] = useState({
    closestDistance: 0,
    pointsChecked: 0
  });

  // Configuration for loop detection
  const LOOP_DETECTION_CONFIG = {
    CLOSURE_DISTANCE_THRESHOLD: 100, // meters - distance to consider loop closed
    MIN_POINTS_FOR_DETECTION: 10,   // minimum path points before checking
    SKIP_RECENT_POINTS: 5,          // skip recent points to avoid false positives
    SMOOTHING_WINDOW: 3,            // points to average for smoothing
    CONFIRMATION_REQUIRED: 2,       // number of consecutive detections needed
  };

  // 1. Manual position updates with 1-second timer
  useEffect(() => {
    if (!isTracking) return;

    let animationFrameId: number;
    let lastUpdateTime = 0;
    const UPDATE_INTERVAL = 1000; // 1 second

    const updatePosition = async (timestamp: number) => {
      if (timestamp - lastUpdateTime < UPDATE_INTERVAL) {
        animationFrameId = requestAnimationFrame(updatePosition);
        return;
      }

      lastUpdateTime = timestamp;

      try {
        const newPosition = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          });
        });

        const { latitude: lat, longitude: lon, accuracy: acc } = newPosition.coords;
        
        if (acc <= 100) {
          const hasMoved = position.lat !== lat || position.lon !== lon;
          
          if (hasMoved) {
            setPosition({ lat, lon, acc });
          }
        }
      } catch (error) {
        console.error('Error getting position:', error);
      }

      if (isTracking) {
        animationFrameId = requestAnimationFrame(updatePosition);
      }
    };

    animationFrameId = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isTracking, position.lat, position.lon]);

  // 2. Initialize the map
  useEffect(() => {
    const mapContainer = document.getElementById('map');
    if (!mapContainer || mapRef.current) return;
    
    if (position.lat !== 0 && position.lon !== 0) {
      mapRef.current = L.map('map').setView([position.lat, position.lon], 18);
      
      const googleSatellite = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '© Google'
      });
      
      const googleStreets = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '© Google'
      });

      googleSatellite.addTo(mapRef.current);

      L.control.layers({
        "Satellite": googleSatellite,
        "Streets": googleStreets
      }).addTo(mapRef.current);

      markerRef.current = L.marker([position.lat, position.lon])
        .addTo(mapRef.current)
        .bindPopup('You are here!')
        .openPopup();
    }
  }, [position.lat, position.lon]);

  // 3. Advanced closed-loop detection algorithm
  const detectClosedLoop = useCallback((currentPoint: PathPoint, path: PathPoint[]): LoopDetectionResult => {
    if (path.length < LOOP_DETECTION_CONFIG.MIN_POINTS_FOR_DETECTION) {
      return { isLoopClosed: false, closestPointIndex: -1, distanceToClosest: Infinity };
    }

    let closestDistance = Infinity;
    let closestPointIndex = -1;
    let pointsChecked = 0;

    const currentLatLng = L.latLng(currentPoint.lat, currentPoint.lon);

    // Check points in the path (skip recent points to avoid false positives)
    for (let i = 0; i < path.length - LOOP_DETECTION_CONFIG.SKIP_RECENT_POINTS; i++) {
      const pathPoint = path[i];
      const pathLatLng = L.latLng(pathPoint.lat, pathPoint.lon);
      const distance = currentLatLng.distanceTo(pathLatLng);

      pointsChecked++;

      if (distance < closestDistance) {
        closestDistance = distance;
        closestPointIndex = i;
      }
    }

    setDetectionStats({
      closestDistance,
      pointsChecked
    });

    const isClosed = closestDistance <= LOOP_DETECTION_CONFIG.CLOSURE_DISTANCE_THRESHOLD;

    return {
      isLoopClosed: isClosed,
      closestPointIndex,
      distanceToClosest: closestDistance,
      loopClosurePoint: isClosed ? path[closestPointIndex] : undefined
    };
  }, []);

  // 4. Position update with loop detection
  useEffect(() => {
    if (!mapRef.current || position.lat === 0 || position.lon === 0) return;

    const newPathPoint: PathPoint = {
      lat: position.lat,
      lon: position.lon,
      timestamp: Date.now()
    };

    setUserPath(prevPath => {
      const updatedPath = [...prevPath, newPathPoint];
      
      // Only detect loops if we have enough points and not already closed
      if (!isLoopClosed && updatedPath.length >= LOOP_DETECTION_CONFIG.MIN_POINTS_FOR_DETECTION) {
        const detectionResult = detectClosedLoop(newPathPoint, updatedPath);
        
        if (detectionResult.isLoopClosed) {
          console.log('🎯 LOOP CLOSED DETECTED!', {
            distance: detectionResult.distanceToClosest,
            closestIndex: detectionResult.closestPointIndex,
            closurePoint: detectionResult.loopClosurePoint
          });
          
          setIsLoopClosed(true);
          setLoopClosurePoint(detectionResult.loopClosurePoint || null);
          
          // Visual feedback for loop closure
          if (mapRef.current && detectionResult.loopClosurePoint) {
            // Remove existing detection circle
            if (loopDetectionCircleRef.current) {
              loopDetectionCircleRef.current.remove();
            }
            
            // Add circle at closure point
            loopDetectionCircleRef.current = L.circle(
              [detectionResult.loopClosurePoint.lat, detectionResult.loopClosurePoint.lon], 
              {
                radius: LOOP_DETECTION_CONFIG.CLOSURE_DISTANCE_THRESHOLD,
                color: '#ff0000',
                fillColor: '#ff0000',
                fillOpacity: 0.2,
                weight: 2
              }
            ).addTo(mapRef.current)
            .bindPopup('Loop Closure Point!')
            .openPopup();
          }
          
        }
      }

      return updatedPath;
    });

    // Update marker and map view
    if (markerRef.current) {
      markerRef.current.setLatLng([position.lat, position.lon]);
    } else {
      markerRef.current = L.marker([position.lat, position.lon])
        .addTo(mapRef.current)
        .bindPopup('You are here!')
        .openPopup();
    }

    mapRef.current.setView([position.lat, position.lon], 18, {
      animate: true,
      duration: 0.5,
      easeLinearity: 0.25
    });

    updatePathOnMap(userPath);

  }, [position.lat, position.lon, detectClosedLoop, isLoopClosed]);

  // 5. Create polygon when loop is closed
  const createPolygonFromPath = useCallback(() => {
    if (!mapRef.current || userPath.length < 3 || !loopClosurePoint) return;

    // Find the index where the loop closes
    const closureIndex = userPath.findIndex(point => 
      Math.abs(point.lat - loopClosurePoint.lat) < 0.000001 && 
      Math.abs(point.lon - loopClosurePoint.lon) < 0.000001
    );

    if (closureIndex === -1) return;

    // Create polygon from start to closure point
    const polygonPoints = userPath.slice(0, closureIndex + 1);
    
    // Ensure polygon is closed by adding the first point at the end
    const closedPolygonPoints = [...polygonPoints, polygonPoints[0]];

    // Create the polygon
    const polygon = L.polygon(closedPolygonPoints.map(p => [p.lat, p.lon]), {
      color: '#007bff',
      fillColor: '#007bff',
      fillOpacity: 0.3,
      weight: 4
    }).addTo(mapRef.current);

    // Add popup with polygon info
    const area = calculatePolygonArea(closedPolygonPoints);
    polygon.bindPopup(`
      <div>
        <h3>Polygon Created!</h3>
        <p>Points: ${closedPolygonPoints.length}</p>
        <p>Area: ${area.toFixed(2)} m²</p>
        <p>Loop closed at point ${closureIndex}</p>
      </div>
    `).openPopup();

    // Fit map to polygon bounds
    mapRef.current.fitBounds(polygon.getBounds());

    console.log('✅ Polygon created with', closedPolygonPoints.length, 'points');
    
    return polygon;
  }, [userPath, loopClosurePoint]);

  // 6. Calculate polygon area (simplified)
  const calculatePolygonArea = (points: PathPoint[]): number => {
    if (points.length < 3) return 0;
    
    let area = 0;
    const n = points.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += points[i].lon * points[j].lat;
      area -= points[j].lon * points[i].lat;
    }
    
    return Math.abs(area / 2) * 111319.9; // Rough conversion to square meters
  };

  // 7. Update path visualization
  const updatePathOnMap = (path: PathPoint[]) => {
    if (!mapRef.current || path.length < 2) return;

    if (pathPolylineRef.current) {
      pathPolylineRef.current.remove();
    }

    pathPolylineRef.current = L.polyline(path.map(p => [p.lat, p.lon]), {
      color: isLoopClosed ? '#00ff00' : '#007bff',
      weight: 6,
      opacity: 0.8,
      lineJoin: 'round',
      lineCap: 'round'
    }).addTo(mapRef.current);
  };

  // 8. Reset everything
  const resetPath = () => {
    setUserPath([]);
    setIsLoopClosed(false);
    setLoopClosurePoint(null);
    setDetectionStats({ closestDistance: 0, pointsChecked: 0 });
    
    if (pathPolylineRef.current) {
      pathPolylineRef.current.remove();
      pathPolylineRef.current = null;
    }
    
    if (loopDetectionCircleRef.current) {
      loopDetectionCircleRef.current.remove();
      loopDetectionCircleRef.current = null;
    }
  };

  // 9. Auto-create polygon when loop is detected
  useEffect(() => {
    if (isLoopClosed && loopClosurePoint) {
      // Small delay for visual feedback before creating polygon
      const timer = setTimeout(() => {
        createPolygonFromPath();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isLoopClosed, loopClosurePoint, createPolygonFromPath]);

  const getTotalDistance = () => {
    if (userPath.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < userPath.length; i++) {
      const prev = userPath[i - 1];
      const curr = userPath[i];
      totalDistance += L.latLng(prev.lat, prev.lon).distanceTo(L.latLng(curr.lat, curr.lon));
    }
    return totalDistance;
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${meters.toFixed(1)} m`;
    return `${(meters / 1000).toFixed(2)} km`;
  };

  return (
    <div id="map" style={{ position: 'relative', height: '100vh', width: '100%' }}>
      {/* Back to Home Button */}
      <div style={{ position: 'absolute', top: '20px', left: '10px', zIndex: 1000 }}>
        <button onClick={() => navigate("/")} style={buttonStyle}>
          ← Home
        </button>
      </div>

      {/* Control Panel */}
      <div style={controlPanelStyle}>
        <h4 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: isTracking ? '#10b981' : '#ef4444',
            animation: isTracking ? 'pulse 1s infinite' : 'none'
          }}></div>
          Live Tracking {isTracking ? 'ON' : 'OFF'}
        </h4>
        
        <div style={infoStyle}>
          <div><strong>Lat:</strong> {position.lat.toFixed(6)}</div>
          <div><strong>Lon:</strong> {position.lon.toFixed(6)}</div>
          <div><strong>Accuracy:</strong> {position.acc.toFixed(1)}m</div>
          <div><strong>Path Points:</strong> {userPath.length}</div>
        </div>
        
        {/* Loop Detection Status */}
        <div style={{
          margin: '10px 0',
          padding: '8px',
          backgroundColor: isLoopClosed ? '#dcfce7' : '#f3f4f6',
          border: `2px solid ${isLoopClosed ? '#10b981' : '#d1d5db'}`,
          borderRadius: '4px'
        }}>
          <strong style={{ color: isLoopClosed ? '#065f46' : '#374151' }}>
            {isLoopClosed ? '✅ LOOP CLOSED!' : '🔄 Detecting Loop...'}
          </strong>
          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
            Closest: {detectionStats.closestDistance.toFixed(1)}m / {LOOP_DETECTION_CONFIG.CLOSURE_DISTANCE_THRESHOLD}m
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
          <button
            onClick={() => setIsTracking(!isTracking)}
            style={{
              ...buttonStyle,
              backgroundColor: isTracking ? '#ef4444' : '#10b981'
            }}
          >
            {isTracking ? '⏸️ Pause' : '▶️ Resume'} Tracking
          </button>
          
          <button
            onClick={resetPath}
            style={{
              ...buttonStyle,
              backgroundColor: '#6b7280'
            }}
          >
            🗑️ Reset Path
          </button>

          {isLoopClosed && (
            <button
              onClick={createPolygonFromPath}
              style={{
                ...buttonStyle,
                backgroundColor: '#10b981',
                animation: 'pulse 2s infinite'
              }}
            >
              🎯 Create Polygon Now
            </button>
          )}
        </div>
      </div>

      {/* Status Indicator */}
      <div style={statusStyle}>
        <div style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: isLoopClosed ? '#10b981' : (isTracking ? '#10b981' : '#6b7280'),
          animation: (isTracking || isLoopClosed) ? 'pulse 1s infinite' : 'none'
        }}></div>
        {isLoopClosed ? '✅ Loop Closed - Polygon Ready!' : 
         isTracking ? '🔄 Tracking - Looking for loop closure...' : '⏸️ Tracking paused'}
      </div>

      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </div>
  );
}

// Styles
const buttonStyle = {
  backgroundColor: '#2563eb',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  padding: '8px 12px',
  cursor: 'pointer',
  fontWeight: 'bold' as const,
  width: '100%'
};

const controlPanelStyle = {
  position: 'absolute' as const,
  top: '20px',
  right: '20px',
  zIndex: 1000,
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  padding: '15px',
  borderRadius: '8px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
  minWidth: '250px'
};

const infoStyle = {
  fontSize: '12px',
  marginBottom: '10px',
  lineHeight: '1.4'
};

const statusStyle = {
  position: 'absolute' as const,
  bottom: '20px',
  left: '20px',
  zIndex: 1000,
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  padding: '10px 15px',
  borderRadius: '8px',
  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
  fontSize: '14px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
};

export default MapView;