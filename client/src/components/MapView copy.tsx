import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from "react-router-dom";

interface PathPoint {
  lat: number;
  lon: number;
}

function MapView() {
  const navigate = useNavigate();
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const pathPolylineRef = useRef<L.Polyline | null>(null);
  
  const [userPath, setUserPath] = useState<PathPoint[]>([]);
  const [position, setPosition] = useState<{ lat: number; lon: number; acc: number }>({ 
    lat: 0, 
    lon: 0, 
    acc: 0 
  });
  const [isTracking, setIsTracking] = useState(true);

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
        // Get fresh position data
        const newPosition = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0 // Always get fresh position
          });
        });

        const { latitude: lat, longitude: lon, accuracy: acc } = newPosition.coords;
        
        // Only update if accuracy is reasonable and position has changed
        if (acc <= 100) {
          const hasMoved = position.lat !== lat || position.lon !== lon;
          
          if (hasMoved) {
            console.log(`Position updated: ${lat.toFixed(6)}, ${lon.toFixed(6)}, Acc: ${acc}m`);
            setPosition({ lat, lon, acc });
          }
        } else {
          console.warn(`Low accuracy: ${acc}m - update skipped`);
        }
      } catch (error) {
        console.error('Error getting position:', error);
      }

      // Continue the update loop
      if (isTracking) {
        animationFrameId = requestAnimationFrame(updatePosition);
      }
    };

    // Start the update loop
    animationFrameId = requestAnimationFrame(updatePosition);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isTracking, position.lat, position.lon]);

  // 2. Initialize the map
  useEffect(() => {
    const mapContainer = document.getElementById('map');
    if (!mapContainer || mapRef.current) return;
    
    if (position.lat !== 0 && position.lon !== 0) {
      console.log('Initializing map at:', position.lat, position.lon);
      mapRef.current = L.map('map').setView([position.lat, position.lon], 18);
      
      // Use HTTPS
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

      // Add initial marker
      markerRef.current = L.marker([position.lat, position.lon])
        .addTo(mapRef.current)
        .bindPopup('You are here!')
        .openPopup();
    }
  }, [position.lat, position.lon]);

  // 3. Update marker, map view, and path when position changes
  useEffect(() => {
    if (!mapRef.current || position.lat === 0 || position.lon === 0) return;

    console.log('Updating map to new position:', position.lat, position.lon);

    // Update or create marker
    if (markerRef.current) {
      markerRef.current.setLatLng([position.lat, position.lon]);
    } else {
      markerRef.current = L.marker([position.lat, position.lon])
        .addTo(mapRef.current)
        .bindPopup('You are here!')
        .openPopup();
    }

    // Smoothly update map view
    mapRef.current.setView([position.lat, position.lon], 18, {
      animate: true,
      duration: 0.5,
      easeLinearity: 0.25
    });

    // Update user path
    setUserPath(prevPath => {
      const newPath = [...prevPath, { lat: position.lat, lon: position.lon }];
      updatePathOnMap(newPath);
      return newPath;
    });

  }, [position.lat, position.lon]);

  // Function to update the path polyline on the map
  const updatePathOnMap = (path: PathPoint[]) => {
    if (!mapRef.current || path.length < 2) return;

    // Remove existing path polyline
    if (pathPolylineRef.current) {
      pathPolylineRef.current.remove();
    }

    // Add updated path
    pathPolylineRef.current = L.polyline(path.map(p => [p.lat, p.lon]), {
      color: '#007bff',
      weight: 6,
      opacity: 0.8,
      lineJoin: 'round',
      lineCap: 'round'
    }).addTo(mapRef.current);
  };

  // Function to clear the path
  const clearPath = () => {
    setUserPath([]);
    if (pathPolylineRef.current) {
      pathPolylineRef.current.remove();
      pathPolylineRef.current = null;
    }
  };

  // Toggle tracking
  const toggleTracking = () => {
    setIsTracking(!isTracking);
  };

  // Calculate total distance traveled
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
    if (meters < 1000) {
      return `${meters.toFixed(1)} m`;
    } else {
      return `${(meters / 1000).toFixed(2)} km`;
    }
  };

  // Calculate movement speed (m/s)
  const getCurrentSpeed = () => {
    if (userPath.length < 2) return 0;
    
    const recentPoints = userPath.slice(-2); // Last two points
    const prev = recentPoints[0];
    const curr = recentPoints[1];
    const distance = L.latLng(prev.lat, prev.lon).distanceTo(L.latLng(curr.lat, curr.lon));
    const timeDiff = 1; // 1 second between updates
    return distance / timeDiff;
  };

  return (
    <div id="map" style={{ position: 'relative', height: '100vh', width: '100%' }}>
      {/* Back to Home Button */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '10px',
        zIndex: 1000
      }}>
        <button
          onClick={() => navigate("/")}
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            padding: '10px 15px',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            fontWeight: 'bold',
            marginRight: '10px'
          }}
        >
          ← Home
        </button>
      </div>

      {/* Control Panel */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        minWidth: '250px'
      }}>
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
        
        <div style={{ fontSize: '12px', marginBottom: '10px', lineHeight: '1.4' }}>
          <div><strong>Lat:</strong> {position.lat.toFixed(6)}</div>
          <div><strong>Lon:</strong> {position.lon.toFixed(6)}</div>
          <div><strong>Accuracy:</strong> {position.acc.toFixed(1)}m</div>
          <div><strong>Speed:</strong> {(getCurrentSpeed() * 3.6).toFixed(1)} km/h</div>
        </div>
        
        <div style={{ margin: '10px 0', padding: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
          <strong>Distance: {formatDistance(getTotalDistance())}</strong>
          <div style={{ fontSize: '11px', color: '#6b7280' }}>
            Points: {userPath.length}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
          <button
            onClick={toggleTracking}
            style={{
              backgroundColor: isTracking ? '#ef4444' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              padding: '8px 12px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {isTracking ? '⏸️ Pause' : '▶️ Resume'} Tracking
          </button>
          
          <button
            onClick={clearPath}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              padding: '8px 12px',
              cursor: 'pointer'
            }}
          >
            🗑️ Clear Path
          </button>
        </div>
      </div>

      {/* Status Indicator */}
      <div style={{
        position: 'absolute',
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
      }}>
        <div style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: isTracking ? '#10b981' : '#6b7280',
          animation: isTracking ? 'pulse 1s infinite' : 'none'
        }}></div>
        {isTracking ? '🔄 Updating every second...' : '⏸️ Tracking paused'}
      </div>

      {/* CSS for pulse animation */}
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

export default MapView;