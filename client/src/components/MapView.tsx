import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from "react-router-dom";
import axios from "axios"; 
import {BrowserStorageService} from '@shared/login'
 
import {getUserPathByUsername} from "@shared/Get_Path"
import {savePolygon} from "@shared/Save_Polygon"

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
  const [isTracking, setIsTracking] = useState(true);
  const [isLoopClosed, setIsLoopClosed] = useState(false);
  const [polygonName, setPolygonName] = useState<string>('');
  const [showNameForm, setShowNameForm] = useState(false);
  
  // Fixed: Use state for timer instead of var
  const [timerInterval, setTimerInterval] = useState(3000);

 
 

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

    // Update timer after map initialization
    setTimerInterval(5000);

    // Initialize polyline immediately
    pathPolylineRef.current = L.polyline([], { color: 'blue', weight: 4 }).addTo(mapRef.current);

    // Get User Data (handle both shapes: { userData } wrapper or direct object)
    BrowserStorageService.getUserFromStorage().then(async (userinfo: any) => {
      const info = userinfo?.userData ? userinfo.userData : userinfo;
      if (!info?.username) {
        console.error("No user data found");
        return;
      }

      setUserData({
        username: info.username,
        useremail: info.useremail,
        userpath: []
      });

      console.log("UserInfo : ", info.username);
      console.log("Db User Path ............");
      const path = await getUserPathDirectly(info.username);
      console.log("Loaded path:", path);
      setUserPath(path || []); // Ensure it's always an array
    }).catch(error => {
      console.error("Error loading user data:", error);
    });
  }
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
      const response = await axios.post("/api/detect-loops", {
        'userpath': userPath,
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


//save polygon
  const savePolygonFromPath=()=>{
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

  axios.post('/api/save-polygons',{
    username: userData.username,
    polygonName: polygonName,
    polygons: userPath
  }).then(()=>{
    console.log("Polygon gets saved to the Db");
    delteUserPathAsync();
  }).catch((err)=>{
    console.log("Polygon is NOT SAVED", err);
  });
   
  
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
          <div><strong>UserName:</strong> {userData?.username}</div>
          <div><strong>Lat:</strong> {position.lat.toFixed(6)}</div>
          <div><strong>Lon:</strong> {position.lon.toFixed(6)}</div>
          <div><strong>Accuracy:</strong> {position.acc.toFixed(1)}m</div> 
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
        </div>
        
        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
          <button
            onClick={() => {              
              setIsTracking(!isTracking); 
              // saveUserPathAsync();
            }}
            style={{
              ...buttonStyle,
              backgroundColor: isTracking ? '#ef4444' : '#10b981'
            }}
          >
            {isTracking ? '⏸️ Pause' : '▶️ Resume'} Tracking
          </button>
          <button
            onClick={() => {              
              saveUserPathAsync();
            }}
            style={{
              ...buttonStyle,
              backgroundColor: isTracking ? '#ef4444' : '#10b981'
            }}
          >
            Save UserPath
          </button>
          
          
          <button
            onClick={()=>{
              saveUserPathAsync();
              detectLoops(); 
              
            }}
            style={{
              ...buttonStyle,
              backgroundColor: '#4f46e5'
            }}
          >
            🔍 Detect Loops
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
              onClick={() => setShowNameForm(true)}
              style={{
                ...buttonStyle,
                backgroundColor: '#10b981',
                animation: 'pulse 2s infinite'
              }}
            >
              🎯 Create Polygon Now
            </button>
          )}

          
          {isLoopClosed && (
            <button
              onClick={savePolygonFromPath}
              style={{
                ...buttonStyle,
                backgroundColor: '#10b981',
                animation: 'pulse 2s infinite'
              }}
            >
              Save Polygon To the Database
            </button>
          )}

          {/* Inline polygon name form */}
          {showNameForm && (
            <div style={{ marginTop: 8, padding: 8, background: '#fff', borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13 }}>Polygon name</label>
              <input
                value={polygonName}
                onChange={(e) => setPolygonName(e.target.value)}
                placeholder="Enter polygon name"
                style={{ width: '100%', padding: '8px', borderRadius: 4, border: '1px solid #d1d5db', marginBottom: 8 }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => {
                    // Save name and create polygon
                    setShowNameForm(false);
                    if (polygonName.trim() !== '') {
                      createPolygonFromPath();
                    }
                  }}
                  style={{ ...buttonStyle, backgroundColor: '#10b981' }}
                >
                  Create
                </button>
                <button
                  onClick={() => setShowNameForm(false)}
                  style={{ ...buttonStyle, backgroundColor: '#6b7280' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          
          <button 
            style={{
              ...buttonStyle,
              backgroundColor: '#4f46e5'
            }}
          >
             Show My NFTs
          </button>
          
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

// Styles (unchanged)
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
