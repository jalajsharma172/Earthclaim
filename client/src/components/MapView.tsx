import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getUserPathByUsername, savePolygon } from './map-helpers';
import { useActiveAccount } from "thirdweb/react";
// BrowserStorageService removed

// Fix Leaflet icon issues
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface PathPoint {
  lat: number;
  lon: number;
}


interface UserDataSchema {
  username: string;
  useremail: string;
  userpath: PathPoint[]; // Add this property
}

interface SimpleUserPolygon {
  id: number;
  username: string;
  polygon: number[][][];
  // [ 
  //    [ [lon, lat], [lon, lat], ... ],
  //    [ [lon, lat], [lon, lat], ... ]
  // ]
}

function MapView() {
  const activeAccount = useActiveAccount();
  const navigate = useNavigate();
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const pathPolylineRef = useRef<L.Polyline | null>(null);
  const [userData, setUserData] = useState<UserDataSchema | null>(null);





  const [userPath, setUserPath] = useState<PathPoint[]>([]);// Save it in USERDATA PATH
  const [position, setPosition] = useState<{ lat: number; lon: number; acc: number }>({
    lat: 0,
    lon: 0,
    acc: 0
  });
  const [isTracking, setIsTracking] = useState(false);
  const [isLoopClosed, setIsLoopClosed] = useState(false);
  const [polygonName, setPolygonName] = useState<string>('');
  const [showNameForm, setShowNameForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [showHud, setShowHud] = useState(true);

  // Fixed: Use state for timer instead of var
  const [timerInterval, setTimerInterval] = useState(3000);

  // Free Polygons State
  const [freeMode, setFreeMode] = useState(false);
  const [freePolygons, setFreePolygons] = useState<any[]>([]);
  const [currentFreePolygonIndex, setCurrentFreePolygonIndex] = useState(0);
  const freePolygonLayerRef = useRef<L.Polygon | null>(null);




  // 1️⃣ GPS tracking + marker update + path update
  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const { latitude: lat, longitude: lon, accuracy: acc } = coords;

          // Ignore inaccurate readings
          if (acc > 250) return;

          // Update position
          setPosition({ lat, lon, acc });

          // Update marker & map
          if (markerRef.current && mapRef.current) {
            markerRef.current.setLatLng([lat, lon]);
            mapRef.current.panTo([lat, lon]);
          }

          // Append new path point
          setUserPath(prev => [
            ...prev,
            { lat, lon }
          ]);

          console.log("Updated position:", { lat, lon, acc });



        },
        err => console.error("Error getting location:", err),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }, timerInterval);

    return () => clearInterval(interval);
  }, [isTracking, timerInterval]);

  // 2️⃣ Initialize map
  useEffect(() => {
    const initMap = async () => {
      try {
        const mapContainer = document.getElementById('map');
        if (!mapContainer) {
          setError('Map container not found');
          return;
        }


        if (mapRef.current) return;

        // Check for geolocation support
        if (!navigator.geolocation) {
          setError('Geolocation is not supported by your browser');
          return;
        }

        // Get initial position
        if (position.lat === 0 && position.lon === 0) {
          navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
              setPosition({
                lat: coords.latitude,
                lon: coords.longitude,
                acc: coords.accuracy
              });
            },
            (err) => {
              setError(`Error getting location: ${err.message}`);
            }
          );
        }
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

        // Update timer after map initialization
        setTimerInterval(5000);

        // Initialize polyline immediately
        pathPolylineRef.current = L.polyline([], { color: 'blue', weight: 4 }).addTo(mapRef.current);

        // Removed BrowserStorageService
        const info = { username: "Guest", useremail: "guest@example.com" };

        setUserData({
          username: info.username,
          useremail: info.useremail,
          userpath: []
        });

        console.log("UserInfo : ", info.username);
        // Skip path loading for Guest or handle if needed
        const path = await getUserPathDirectly(info.username);
        setUserPath(path || []); // Ensure it's always an array
      } catch (err) {
        setError(`Error initializing map: ${err}`);
      }
    };
    initMap();

  }, [position.lat, position.lon]);


  // Save UserPath
  const saveUserPathAsync = async () => {
    try {
      if (!userData || !userData.username) {
        console.error("User data or username is missing.");
        return;
      }

      const response = await axios.post("/api/paths", {
        username: userData?.username,
        paths: userPath
      });
      console.log(response);

      if (response.data.success) {
        console.log("Paths saved successfully:", response.data);
      } else {
        console.log("Failed to save paths:", response.data.message);
      }
    } catch (error) {
      console.log("Can't able to save paths:", error);
    }
  }



  //Fetch UserPath
  const getUserPathDirectly = async (username: string) => {
    try {
      if (!username) {
        console.error("No username provided");
        return [];
      }

      const result = await getUserPathByUsername(username);

      if (result.success === false) {
        console.error("Error fetching user path:", result.data);
        return []; // Return empty array for non-existent users
      }

      console.log("User path data:", result.data);

      // Ensure we always return an array of PathPoint objects
      if (Array.isArray(result.data)) {
        // Filter out any invalid points and ensure they have lat/lon properties
        const validPath = result.data.filter(point =>
          point && typeof point.lat === 'number' && typeof point.lon === 'number'
        );
        console.log(`Loaded ${validPath.length} valid path points`);
        return validPath;
      } else if (result.data && typeof result.data.lat === 'number' && typeof result.data.lon === 'number') {
        // Single point object
        return [result.data];
      } else {
        console.log("No valid path data found for user:", username);
        return [];
      }
    } catch (error) {
      console.error("Error in getUserPathDirectly:", error);
      return []; // Always return array, never null
    }
  };

  // Print UserPath
  useEffect(() => {
    if (!mapRef.current) return;

    // Safety check - ensure userPath is an array
    if (!Array.isArray(userPath)) {
      console.warn("userPath is not an array:", userPath);
      return;
    }

    const latlngs: L.LatLngExpression[] = userPath.map(p => [p.lat, p.lon]);

    // Ensure pathPolylineRef.current exists before using it
    if (!pathPolylineRef.current && mapRef.current) {
      // Initialize the polyline if it doesn't exist
      pathPolylineRef.current = L.polyline([], { color: 'blue', weight: 4 }).addTo(mapRef.current);
    }

    // Now safely set the latlngs
    if (pathPolylineRef.current) {
      pathPolylineRef.current.setLatLngs(latlngs);
    }

    // Move Map Smoothly to the current to latest position
    if (latlngs.length && mapRef.current) {
      const last = latlngs[latlngs.length - 1];
      mapRef.current.panTo(last);
    }
  }, [userPath]);



  //Fetech Path
  // useEffect(() => {
  //   // getUserPathDirectly(current);
  // }, []);


  const delteUserPathAsync = async () => {
    try {
      if (!userData || !userData.username) {
        console.error("User data or username is missing.");
        return;
      }

      const response = await axios.delete("/api/paths", {
        data: { username: userData?.username }
      });
      console.log(userData);

      if (response.data.success) {
        console.log("Paths deleted successfully:", response.data);
      } else {
        console.log("Failed to save paths:", response.data.message);
      }
    } catch (error) {
      console.log("Can't able to save paths:", error);
    }
  }


  // Loop detection
  const detectLoops = async () => {
    try {
      // Client-side call remains the same
      const response = await axios.post("/api/detect-loops", {
        userpath: userPath,
        tolerance: 30.0,
        config: {
          minPoints: 15,
          confidenceThreshold: 0.4
        }
      });

      if (response.data.closed_loops === true) {
        console.log("Triggered !!!!!!!!!!!!!!!!!!!!!!!!!!!");
        setIsLoopClosed(true);
        createPolygonFromPath();
      } else {
        console.log("No closed loop detected");
        setIsLoopClosed(false);
      }
      console.log(response.data);
    } catch (error) {
      console.error("Error detecting loops:", error);
    }
  };

  // Reset path function (uncommented as it's referenced in JSX)
  const resetPath = () => {
    setUserPath([]);
    setIsLoopClosed(false);
    if (pathPolylineRef.current) {
      pathPolylineRef.current.setLatLngs([]);
    }
    delteUserPathAsync();
  };

  const createPolygonFromPath = useCallback(() => {
    if (userPath.length === 0) return null;

    const loopClosurePoint = userPath[userPath.length - 1];

    // Find the index where the loop closes
    const closureIndex = userPath.findIndex((point, index) =>
      index < userPath.length - 1 && // Don't match the last point itself
      Math.abs(point.lat - loopClosurePoint.lat) < 0.0001 &&
      Math.abs(point.lon - loopClosurePoint.lon) < 0.0001
    );

    if (closureIndex === -1) return null;

    // Create polygon from start to closure point
    const polygonPoints = userPath.slice(0, closureIndex + 1);

    // Ensure polygon is closed by adding the first point at the end
    const closedPolygonPoints = [...polygonPoints, polygonPoints[0]];

    // Create the polygon
    let polygon: L.Polygon | undefined;
    if (mapRef.current) {
      polygon = L.polygon(closedPolygonPoints.map(p => [p.lat, p.lon]), {
        color: '#007bff',
        fillColor: '#007bff',
        fillOpacity: 0.3,
        weight: 4
      }).addTo(mapRef.current);

      // Add popup with polygon info (use polygonName if available)
      const area = calculatePolygonArea(closedPolygonPoints);
      const title = polygonName && polygonName.trim() !== '' ? polygonName : 'Polygon Created!';
      polygon.bindPopup(`
        <div>
          <h3>${title}</h3>
          <p>Points: ${closedPolygonPoints.length}</p>
          <p>Area: ${area.toFixed(2)} m²</p>
          <p>Loop closed at point ${closureIndex}</p>
        </div>
      `).openPopup();

      // Fit map to polygon bounds
      mapRef.current.fitBounds(polygon.getBounds());

      console.log('✅ Polygon created with', closedPolygonPoints.length, 'points');
      //  SAVE POLYGON TO THE DATABASE .
      console.log(closedPolygonPoints);


    }

    return polygon;
  }, [userPath, polygonName]);


  // 6. Calculate polygon area (moved outside detectLoops)
  const calculatePolygonArea = (points: PathPoint[]): number => {
    if (points.length < 3) return 0;

    let area = 0;
    const n = points.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += points[i].lon * points[j].lat;
      area -= points[j].lon * points[i].lat;
    }

    return Math.abs(area / 2) * 111319.9;
  };

  // Render Free Polygon
  useEffect(() => {
    if (!freeMode || !mapRef.current || freePolygons.length === 0) {
      if (freePolygonLayerRef.current) {
        freePolygonLayerRef.current.remove();
        freePolygonLayerRef.current = null;
      }
      return;
    }

    const currentPoly = freePolygons[currentFreePolygonIndex];
    if (!currentPoly || !currentPoly.coordinates) return;

    // Remove previous layer
    if (freePolygonLayerRef.current) {
      freePolygonLayerRef.current.remove();
    }

    // Coordinates from server are [lon, lat], Leaflet wants [lat, lon]
    const latlngs = currentPoly.coordinates.map((coord: number[]) => [coord[1], coord[0]]);

    // Create and add new polygon
    const polygonLayer = L.polygon(latlngs, {
      color: '#a855f7', // Purple for free polygons
      fillColor: '#9333ea',
      fillOpacity: 0.4,
      weight: 3
    }).addTo(mapRef.current);

    // Bind popup
    polygonLayer.bindPopup(`
      <div>
        <h3>${currentPoly.name}</h3>
        <p>Free Polygon ${currentFreePolygonIndex + 1} of ${freePolygons.length}</p>
      </div>
    `).openPopup();

    // Fit bounds
    mapRef.current.fitBounds(polygonLayer.getBounds());

    freePolygonLayerRef.current = polygonLayer;

  }, [freeMode, currentFreePolygonIndex, freePolygons]);


  //save polygon
  const savePolygonFromPath = () => {
    if (!userData?.username || userPath.length < 3) {
      console.error('Cannot save polygon: Invalid data');
      return;
    }
    // If polygonName is not set, show the form so user can enter one
    if (!polygonName || polygonName.trim() === '') {
      setShowNameForm(true);
      console.warn('polygonName is empty — prompting user to enter a name before saving');
      return;
    }

    axios.post('/api/save-polygons', {
      username: userData.username,
      polygonName: polygonName,
      polygons: userPath
    }).then(() => {
      console.log("Polygon gets saved to the Db");
      delteUserPathAsync();
    }).catch((err) => {
      console.log("Polygon is NOT SAVED", err);
    });


  };
  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%', background: '#0f172a' }}>
      <div id="map" style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '100%', opacity: showMap ? 1 : 0, pointerEvents: showMap ? 'auto' : 'none', transition: 'opacity 0.5s ease', zIndex: 0 }}></div>

      {/* Back/Menu Button */}
      <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 1000 }}>
        <button onClick={() => {
          if (showMap) {
            setShowMap(false);
            setGameActive(false);
            setIsTracking(false);
            setFreeMode(false);
            // Clear free polygon layer
            if (freePolygonLayerRef.current) {
              freePolygonLayerRef.current.remove();
              freePolygonLayerRef.current = null;
            }
          } else {
            navigate("/");
          }
        }}
          style={homeButtonStyle}
        >
          <span style={{ fontSize: '16px' }}>←</span> {showMap ? 'MENU' : 'HOME'}
        </button>
      </div>

      {/* Dashboard Button - Visible when game is not active (to avoid HUD conflict) */}
      {!gameActive && (
        <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000 }}>
          <button
            onClick={() => navigate("/dashboard")}
            style={homeButtonStyle}
          >
            DASHBOARD <span style={{ fontSize: '16px' }}>→</span>
          </button>
        </div>
      )}

      {/* Menu Overlay - Visible when Map is Hidden */}
      {!showMap && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(15, 23, 42, 0.95)', zIndex: 900
        }}>
          <h1 style={{ color: '#00d9ff', fontFamily: 'monospace', marginBottom: '40px', fontSize: '32px', letterSpacing: '4px', textShadow: '0 0 20px rgba(0,217,255,0.5)' }}>
            EARTH CLAIM
          </h1>
          <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
            <button onClick={() => {
              setGameActive(true);
              setShowMap(true);
              setIsTracking(true);
              setShowHud(true);
            }}
              style={{
                ...actionButtonStyle,
                fontSize: '16px',
                padding: '20px 40px',
                background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
                boxShadow: '0 0 30px rgba(0,255,136,0.3)',
                minWidth: '200px',
                textAlign: 'center'
              }}
            >
              🎮 START GAME
            </button>
            <button onClick={() => {
              setShowMap(true);
              setGameActive(false);
              setIsTracking(false);
            }}
              style={{
                ...actionButtonStyle,
                fontSize: '16px',
                padding: '20px 40px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                boxShadow: '0 0 30px rgba(59,130,246,0.3)',
                minWidth: '200px',
                textAlign: 'center'
              }}
            >
              🌍 SHOW MAP
            </button>
            <button onClick={() => {
              axios.get("/api/free-polygons", {
                params: { walletaddress: activeAccount?.address }
              }).then(res => {
                if (res.data && Array.isArray(res.data)) {
                  setFreePolygons(res.data);
                  setFreeMode(true);
                  setShowMap(true);
                  setGameActive(false);
                  setIsTracking(false);
                  setCurrentFreePolygonIndex(0);
                  // Clear user path to avoid conflicts
                  setUserPath([]);
                }
              }).catch(err => console.error("Failed to fetch free polygons:", err));
              console.log("Get Free Polygons Clicked");
            }}
              style={{
                ...actionButtonStyle,
                fontSize: '16px',
                padding: '20px 40px',
                background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
                boxShadow: '0 0 30px rgba(168,85,247,0.3)',
                minWidth: '200px',
                textAlign: 'center'
              }}
            >
              🎁 GET FREE POLYGONS
            </button>
          </div>
        </div>
      )}

      {/* HUD Toggle Button - Visible when Game Active but HUD hidden */}
      {gameActive && !showHud && (
        <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000 }}>
          <button onClick={() => setShowHud(true)} style={actionButtonStyle}>
            📑 SHOW HUD
          </button>
        </div>
      )}

      {/* Control Panel - Gaming HUD Style - Visible in Game Mode */}
      {gameActive && showHud && (
        < div style={controlPanelStyle} >
          {/* Header with Close Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <div style={hudHeaderStyle}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isTracking ? '#00ff88' : '#ff0055',
                boxShadow: isTracking ? '0 0 10px #00ff88' : '0 0 10px #ff0055',
                animation: isTracking ? 'pulse 1s infinite' : 'none'
              }}></div>
              <span style={{ fontSize: '11px', letterSpacing: '2px' }}>
                TRACKING {isTracking ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            <button
              onClick={() => setShowHud(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '0 5px'
              }}
            >
              ✖
            </button>
          </div>

          {/* Info Display */}
          <div style={infoStyle}>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>AGENT:</span>
              <span style={infoValueStyle}>{userData?.username || 'UNKNOWN'}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>LAT:</span>
              <span style={infoValueStyle}>{position.lat.toFixed(6)}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>LON:</span>
              <span style={infoValueStyle}>{position.lon.toFixed(6)}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>ACC:</span>
              <span style={infoValueStyle}>{position.acc.toFixed(1)}m</span>
            </div>
          </div>

          {/* Loop Detection Status - Enhanced */}
          <div style={{
            margin: '12px 0',
            padding: '10px',
            background: isLoopClosed
              ? 'linear-gradient(135deg, rgba(0,255,136,0.1) 0%, rgba(0,255,136,0.05) 100%)'
              : 'linear-gradient(135deg, rgba(100,116,139,0.1) 0%, rgba(71,85,105,0.05) 100%)',
            border: `1px solid ${isLoopClosed ? '#00ff88' : '#475569'}`,
            borderRadius: '4px',
            boxShadow: isLoopClosed ? '0 0 15px rgba(0,255,136,0.3)' : 'none',
          }}>
            <div style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              color: isLoopClosed ? '#00ff88' : '#94a3b8',
              letterSpacing: '1px',
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              {isLoopClosed ? '✅ LOOP DETECTED' : '🔄 SCANNING FOR LOOP...'}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
            <button
              onClick={() => {
                setIsTracking(!isTracking);
              }}
              style={{
                ...actionButtonStyle,
                background: isTracking
                  ? 'linear-gradient(135deg, #ff0055 0%, #cc0044 100%)'
                  : 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
                boxShadow: isTracking
                  ? '0 4px 15px rgba(255,0,85,0.4)'
                  : '0 4px 15px rgba(0,255,136,0.4)'
              }}
            >
              {isTracking ? '⏸️ PAUSE' : '▶️ RESUME'}
            </button>

            <button
              onClick={() => saveUserPathAsync()}
              style={{
                ...actionButtonStyle,
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                boxShadow: '0 4px 15px rgba(59,130,246,0.4)'
              }}
            >
              💾 SAVE PATH
            </button>

            <button
              onClick={() => {
                saveUserPathAsync();
                detectLoops();
              }}
              style={{
                ...actionButtonStyle,
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                boxShadow: '0 4px 15px rgba(139,92,246,0.4)'
              }}
            >
              🔍 DETECT LOOP
            </button>

            <button
              onClick={resetPath}
              style={{
                ...actionButtonStyle,
                background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                boxShadow: '0 4px 15px rgba(100,116,139,0.4)'
              }}
            >
              🗑️ RESET PATH
            </button>

            {isLoopClosed && (
              <button
                onClick={() => setShowNameForm(true)}
                style={{
                  ...actionButtonStyle,
                  background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
                  boxShadow: '0 4px 20px rgba(0,255,136,0.6)',
                  animation: 'pulse 2s infinite',
                  border: '2px solid #00ff88'
                }}
              >
                🎯 CREATE POLYGON
              </button>
            )}

            {isLoopClosed && (
              <button
                onClick={savePolygonFromPath}
                style={{
                  ...actionButtonStyle,
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  boxShadow: '0 4px 20px rgba(251,191,36,0.6)',
                  animation: 'pulse 2s infinite',
                  border: '2px solid #fbbf24'
                }}
              >
                💎 SAVE POLYGON
              </button>
            )}

            {/* Inline polygon name form */}
            {showNameForm && (
              <div style={{
                marginTop: 8,
                padding: 10,
                background: 'rgba(15, 23, 42, 0.95)',
                borderRadius: 6,
                border: '1px solid #334155',
                boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
              }}>
                <label style={{
                  display: 'block',
                  marginBottom: 6,
                  fontSize: 10,
                  color: '#00d9ff',
                  letterSpacing: '1px',
                  fontFamily: 'monospace',
                  textTransform: 'uppercase'
                }}>
                  POLYGON NAME
                </label>
                <input
                  value={polygonName}
                  onChange={(e) => setPolygonName(e.target.value)}
                  placeholder="Enter name..."
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: 4,
                    border: '1px solid #475569',
                    background: '#1e293b',
                    color: '#e2e8f0',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    marginBottom: 8
                  }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => {
                      setShowNameForm(false);
                      if (polygonName.trim() !== '') {
                        createPolygonFromPath();
                      }
                    }}
                    style={{
                      ...actionButtonStyle,
                      background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
                      flex: 1
                    }}
                  >
                    CREATE
                  </button>
                  <button
                    onClick={() => setShowNameForm(false)}
                    style={{
                      ...actionButtonStyle,
                      background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                      flex: 1
                    }}
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            )}

            <button
              style={{
                ...actionButtonStyle,
                background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                boxShadow: '0 4px 15px rgba(6,182,212,0.4)',
                marginTop: '8px'
              }}
              onClick={() => navigate('/dashboard')}
            >
              🏆 MY NFTs
            </button>
          </div>
        </div >
      )}

      {/* Status Indicator - Bottom Left (Hide in free mode) */}
      {!freeMode && (
        < div style={statusStyle} >
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isLoopClosed ? '#00ff88' : (isTracking ? '#00d9ff' : '#64748b'),
            boxShadow: (isTracking || isLoopClosed) ? `0 0 10px ${isLoopClosed ? '#00ff88' : '#00d9ff'}` : 'none',
            animation: (isTracking || isLoopClosed) ? 'pulse 1s infinite' : 'none'
          }}></div>
          <span style={{ fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.5px' }}>
            {isLoopClosed ? '✅ LOOP CLOSED - READY' :
              isTracking ? '🔄 TRACKING ACTIVE' : '⏸️ PAUSED'}
          </span>
        </div >
      )}

      {/* Free Mode Navigation Buttons */}
      {showMap && freeMode && (
        <>
          <button
            onClick={() => setCurrentFreePolygonIndex(prev => (prev - 1 + freePolygons.length) % freePolygons.length)}
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              zIndex: 1000,
              ...actionButtonStyle,
              width: 'auto',
              minWidth: '100px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid #a855f7',
              boxShadow: '0 0 15px rgba(168, 85, 247, 0.3)'
            }}
          >
            ⬅ PREV
          </button>

          <button
            onClick={() => setCurrentFreePolygonIndex(prev => (prev + 1) % freePolygons.length)}
            style={{
              position: 'absolute',
              bottom: '20px',
              right: '20px',
              zIndex: 1000,
              ...actionButtonStyle,
              width: 'auto',
              minWidth: '100px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid #a855f7',
              boxShadow: '0 0 15px rgba(168, 85, 247, 0.3)'
            }}
          >
            NEXT ➡
          </button>

          <button
            onClick={() => {
              // 1. Fetch IP
              axios.get('https://api.ipify.org?format=json')
                .then(ipRes => {
                  const userIp = ipRes.data.ip;

                  // 2. Get current polygon coords
                  const currentPoly = freePolygons[currentFreePolygonIndex];
                  if (!currentPoly) {
                    console.error("No polygon selected");
                    return;
                  }

                  // 3. Send to server
                  axios.post("/api/save-generated-polygon", {
                    ip: userIp,
                    wallet: activeAccount?.address,
                    coordinates: currentPoly.coordinates,
                    name: currentPoly.name
                  }).then(res => {
                    console.log("Polygon saved:", res.data);
                    alert("Polygon saved! Check server logs.");
                  }).catch(err => {
                    console.error("Failed to save polygon:", err);
                    console.log(activeAccount?.address);
                    console.log(userIp);
                    console.log(currentPoly.coordinates);
                    console.log(currentPoly.name);

                    alert("Failed to save polygon. Check console.");
                  });

                })
                .catch(err => {
                  console.error("Failed to get IP:", err);
                  alert("Could not determine IP address.");
                });
            }}
            style={{
              position: 'absolute',
              bottom: '20px',
              right: '140px', // Positioned to the left of NEXT
              zIndex: 1000,
              ...actionButtonStyle,
              width: 'auto',
              minWidth: '150px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', // Emerald green
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
              border: '1px solid #10b981'
            }}
          >
            💾 SAVE POLYGON
          </button>
        </>
      )}

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </div >
  );
}

// Styles - Sci-Fi Gaming Theme
const homeButtonStyle = {
  background: 'linear-gradient(135deg, rgba(0, 217, 255, 0.2) 0%, rgba(0, 150, 199, 0.2) 100%)',
  backdropFilter: 'blur(10px)',
  color: '#00d9ff',
  border: '1px solid rgba(0, 217, 255, 0.3)',
  borderRadius: '6px',
  padding: '10px 16px',
  cursor: 'pointer',
  fontWeight: 'bold' as const,
  fontFamily: 'monospace',
  fontSize: '11px',
  letterSpacing: '2px',
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
  transition: 'all 0.3s ease'
};

const controlPanelStyle = {
  position: 'absolute' as const,
  top: '20px',
  right: '20px',
  zIndex: 1000,
  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
  backdropFilter: 'blur(15px)',
  padding: '16px',
  borderRadius: '8px',
  border: '1px solid rgba(100, 116, 139, 0.3)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
  minWidth: '280px',
  maxWidth: '320px'
};

const hudHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '16px',
  paddingBottom: '12px',
  borderBottom: '1px solid rgba(100, 116, 139, 0.3)',
  color: '#00d9ff',
  fontFamily: 'monospace',
  fontWeight: 'bold' as const
};

const infoStyle = {
  fontSize: '11px',
  marginBottom: '12px',
  fontFamily: 'monospace',
  color: '#e2e8f0'
};

const infoRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '6px',
  padding: '4px 0'
};

const infoLabelStyle = {
  color: '#64748b',
  letterSpacing: '1px'
};

const infoValueStyle = {
  color: '#00d9ff',
  fontWeight: 'bold' as const
};

const actionButtonStyle = {
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  padding: '10px 12px',
  cursor: 'pointer',
  fontWeight: 'bold' as const,
  fontFamily: 'monospace',
  fontSize: '11px',
  letterSpacing: '1px',
  width: '100%',
  transition: 'all 0.3s ease',
  textTransform: 'uppercase' as const
};

const statusStyle = {
  position: 'absolute' as const,
  bottom: '20px',
  left: '20px',
  zIndex: 1000,
  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
  backdropFilter: 'blur(10px)',
  padding: '12px 16px',
  borderRadius: '8px',
  border: '1px solid rgba(100, 116, 139, 0.3)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
  fontSize: '12px',
  color: '#e2e8f0',
  display: 'flex',
  alignItems: 'center',
  gap: '10px'
};

export default MapView;
