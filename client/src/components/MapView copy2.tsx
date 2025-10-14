import React, { useEffect, useRef, useState } from 'react';
// import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from "react-router-dom";




// import toast from 'react-hot-toast';
// import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
// import 'leaflet/dist/leaflet.css';
// // import { getUserPath } from '@server/routes.ts';

import { uploadJsonToIPFS } from './UploadToIPFS';
import { calculatePolygonArea } from "@shared/utils/geometry";
import { createClient } from "@supabase/supabase-js";

 
interface PathPoint {
  lat: number;
  lon: number;
}


function MapView() {
  const navigate = useNavigate(); // Add this line
  const mapRef = useRef<L.Map | null>(null);
 
  const [userPath, setUserPath] = useState<PathPoint[]>([]);
  const [userPolygon, setUserPolygon] = useState<PathPoint[]>([]);

 
  // const [totalDistance, setTotalDistance] = useState(0);

  const [position, setPosition] = useState<{ lat: number; lon: number; acc: number }>({ lat: 0, lon: 0, acc: 0 });
 
  if (!navigator.geolocation) {
    console.error("Geolocation not supported");
    return;
  }

  // 1. Get LIVE LOCATION
  //timeout: 5000 = "Don't take longer than 5 seconds to find my location"
  // maximumAge: 3000 = "Don't give me location data that's older than 3 seconds"
  
useEffect(() => {
  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude: lat, longitude: lon, accuracy: acc } = position.coords;
      if (acc > 100) return;
      setPosition({ lat, lon, acc });   
    }, 
    (error) => console.error('Location error:', error),
    { enableHighAccuracy: true, timeout: 5000, maximumAge: 1000 }
  );
  
  return () => navigator.geolocation.clearWatch(watchId);
  },[navigator.geolocation.watchPosition]);
 

 
 // 2. Initialize the map
useEffect(() => {
  const mapContainer = document.getElementById('map');
  if (!mapContainer || mapRef.current) return;
  
  if (position.lat !== 0 && position.lon !== 0) {
    mapRef.current = L.map('map').setView([position.lat, position.lon], 18);
    
    // Use HTTPS
    const googleMap = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '© Google'
    });
    
    const googleStreets = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '© Google'
    });

    googleMap.addTo(mapRef.current);

    L.control.layers({
      "Satellite": googleMap,
      "Streets": googleStreets
    }).addTo(mapRef.current);

    // Add a marker at current position
    L.marker([position.lat, position.lon])
      .addTo(mapRef.current)
      .bindPopup('You are here!')
      .openPopup();
  }
}, [position.lat, position.lon]);




  // 3. Draw previous path if any
  useEffect(() => {
      const fetchData = async () => {
          // const path = await getUserPath();
          // setUserPath(path);
          // const polygons = await getUserPolygons();
          // setUserPolygon(polygons);
          // startUserPath();
      };
      fetchData();
  }, []);







  // function startUserPath() {
        // setUserPath({userpath,newuserpath})
  // }

  // function removeUserPathLine() {
  //     if (polylineRef.current) {
  //         polylineRef.current.remove();
  //         polylineRef.current = null;
  //     }
  // }

  // 3. Update position and path using the custom hook
  // useLocationTracker((newPosition) => {
  //   //   if (newPosition.acc > MAX_ACCURACY_THRESHOLD_M) {
  //   //       toast.error(`GPS Accuracy is low (${newPosition.acc.toFixed(1)}m)`);
  //   //       return;
  //   //   }
      
  //     // Don't calculate distance for the very first point
  //     if (position.lat === 0 && position.lon === 0) {
  //         setPosition(newPosition);
  //         return;
  //     }
      
  //     const latlngA = L.latLng(position.lat, position.lon);
  //     const latlngB = L.latLng(newPosition.lat, newPosition.lon);
  //     const temp_distance = latlngA.distanceTo(latlngB);
      
  //     if (temp_distance > 100) {
  //         toast.error(`Skipped large movement of ${temp_distance.toFixed(1)}m`);
  //         // You might want to just update the position without adding to path/distance
  //         // setPosition(newPosition); 
  //         return;
  //     }
      
  //     if (temp_distance < 5) {
  //         // It's better not to notify the user every time they stop, it can be annoying.
  //         // You can add a notification here if you want.
  //         return;
  //     }
 
  //     setTotalDistance(prevDistance => prevDistance + temp_distance);
 
  //     setPosition(newPosition);
  //     setUserPath((prevPath) => [
  //         ...prevPath,
  //         { lat: newPosition.lat, lon: newPosition.lon },
  //     ]);
  // });

 
  // useEffect(() => {
  //     if (mapRef.current) {
  //         if (markerRef.current) {
  //             mapRef.current.removeLayer(markerRef.current);
  //         }
  //         markerRef.current = L.marker([position.lat, position.lon]).addTo(mapRef.current!)
  //             .bindPopup(`Lat: ${position.lat}, Lon: ${position.lon}, Acc: ${position.acc}`)
  //             .openPopup();
  //     }
  //     removeUserPathLine();
  //     createUserPathLine();
  //     mapRef.current?.setView([position.lat, position.lon], 18);
  // }, [position, userPath]);


 
  // async function finalizePolygon(): Promise<string | void> {
  //     const finalCoords = [...userPath, userPath[0]];
  //     const leafletCoords = finalCoords.map((point) => L.latLng(point.lat, point.lon));


      
  //     const newPolygon = L.polygon(leafletCoords, {
  //         color: '#007bff',
  //         fillColor: '#007bff',
  //         fillOpacity: 0.2,
  //     }).addTo(mapRef.current!);
  //     setUserPath([]);
  //     // setIsClosed(true);
  //     mapRef.current!.fitBounds(newPolygon.getBounds());

  //     // Build GeoJSON coordinates [lng, lat]
  //     const geoJsonCoords = finalCoords.map(p => [p.lon, p.lat]);
  //     const polygonGeoJSON = {
  //       type: "Feature" as const,
  //       properties: {},
  //       geometry: {
  //         type: "Polygon" as const,
  //         coordinates: [geoJsonCoords],
  //       },
  //     };

  //     // Calculate area in m^2 using shared geometry util
  //     const areaMeters = calculatePolygonArea(
  //       finalCoords.map(p => ({ lat: p.lat, lng: p.lon }))
  //     );

  //     // Resolve username from localStorage if present
  //     let userName = "Anonymous";
  //     try {
  //       const savedUser = localStorage.getItem('territoryWalkerUser');
  //       if (savedUser) {
  //         const parsed = JSON.parse(savedUser);
  //         if (parsed?.username) userName = parsed.username;
  //       }
  //     } catch {}
      
  //     console.log("Using username for MapView:", userName);

  //     const metadata = {
  //       UserName: userName,
  //       PolygonCoordinates: finalCoords,
  //       Area: areaMeters,
  //       GeoJSON: polygonGeoJSON,
  //     };



 
  //   // IPFS
  //     let hashcode='0000';
  //     var url='';
  //     try {
  //        hashcode = await uploadJsonToIPFS(metadata);
  //       url =`https://fuchsia-secondary-grasshopper-71.mypinata.cloud/ipfs/${hashcode}`
  //       console.log('Metadata pinned at:', url);
  //       // window.alert(url);
  //       return url;
  //     } catch (e) {
  //       console.error('Failed to upload metadata to IPFS', e);
  //     }

  //     // For Dashboard - Save using userNFTAPI  
  //     //userName-> DB
  //     //hashcode-> DB
  //     // try {
  //     //   await userNFTAPI.createUserNFT(userName, hashcode);
  //     //   console.log("Data Saved for Dashboard for user:", userName, "Hash:", hashcode);
  //     //   toast.success(`NFT data saved successfully for ${userName}!`);
  //     // } catch (error) {
  //     //   console.error("Error saving NFT data:", error);
  //     //   toast.error("Failed to save NFT data to database");
  //     // }
  // }

  // --- CHANGE #3: Create a formatted distance string for display ---
  // const formatDistance = (meters: number) => {
  //     if (meters < 1000) {
  //         return `${meters.toFixed(1)} m`;
  //     } else {
  //         return `${(meters / 1000).toFixed(2)} km`;
  //     }
  // };
  
  return (
      <div id="map" style={{ position: 'relative', height: '100vh', width: '100%' }}>
          {/* Back to Home Button */}
          <div style={{
              position: 'absolute',
              top: '100px',
              left: '10px',
              zIndex: 1000,
              borderRadius: '100px'
          }}>
              <button
                  onClick={() => navigate("/")}
                  style={{
                      backgroundColor: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '100%',
                      padding: '20px 20px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                      fontWeight: 'bold'
                  }}
              >
                  ←
              </button>
          </div>
          {/* Finalize Polygon Button */}
          <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000 }}>
              <button
                  // onClick={finalizePolygon}
                  
                //   style={{
                //       backgroundColor: isClosed || userPath.length >= 5 ? 'green' : 'grey',
                //       color: 'white',
                //       border: 'none',
                //       borderRadius: '5px',
                //       padding: '10px 20px',
                //     //   cursor: isClosed || userPath.length >= 5 ? 'pointer' : 'not-allowed',
                //       boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                //   }}
                //   disabled={isClosed || userPath.length < 5}
              >
                  Finalize Polygon
              </button>
          </div>
          {/* --- CHANGE #4: The new and improved distance display --- */}
          {/* <div style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              zIndex: 1000,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              padding: '8px 15px',
              borderRadius: '8px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              fontSize: '18px',
              fontWeight: '600',
              color: '#333'
          }}>
              <span>Distance: {formatDistance(totalDistance)}</span>
          </div>
           */}
      </div>
  );
}


export default MapView;













// // Fix for default markers in Leaflet
// delete (L.Icon.Default.prototype as any)._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
//   iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
//   shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
// });

// function MapView() {
//   const navigate = useNavigate();
//   const mapRef = useRef<L.Map | null>(null);
//   const markerRef = useRef<L.Marker | null>(null);
//   const tileLayerRef = useRef<L.TileLayer | null>(null); // Add tile layer ref
//   const [position, setPosition] = useState<{ lat: number; lon: number; acc: number } | null>(null);
//   const [geolocationSupported, setGeolocationSupported] = useState(true);
//   const [mapInitialized, setMapInitialized] = useState(false); // Track map initialization

//   // Check geolocation support
//   useEffect(() => {
//     if (!navigator.geolocation) {
//       console.error("Geolocation not supported");
//       setGeolocationSupported(false);
//       return;
//     }
//   }, []);

//   // 1. Get LIVE LOCATION
//   useEffect(() => {
//     console.log('checking');
    
//     if (!navigator.geolocation) return;

//     const watchId = navigator.geolocation.watchPosition(
//       (position) => {
//         const { latitude: lat, longitude: lon, accuracy: acc } = position.coords;
//         if (acc > 100) {
//           console.warn('Low accuracy location ignored:', acc);
//           return;
//         }
//         setPosition({ lat, lon, acc });
//         console.log(position);
//       }, 
//       (error) => {
//         console.error('Location error:', error);
//         setGeolocationSupported(false);
//       },
//       { enableHighAccuracy: true, timeout: 1, maximumAge: 0 }
//     );
    
//     return () => navigator.geolocation.clearWatch(watchId);
//   }, []);

//   // 2. Initialize the map when position is available
//   useEffect(() => {
//     // Wait for valid coordinates
//     if (!position || position.lat === 0 || position.lon === 0) {
//       return;
//     }

//     const mapContainer = document.getElementById('map');
//     if (!mapContainer || mapRef.current) return;

//     console.log('Initializing map at:', position.lat, position.lon);
    
//     try {
//       // Initialize map
//       mapRef.current = L.map('map').setView([position.lat, position.lon], 18);
      
//       // Use HTTPS - fix the tile layer URL
//       const googleSatellite = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
//         maxZoom: 20,
//         subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
//         attribution: '© Google'
//       });

//       const googleStreets = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
//         maxZoom: 20,
//         subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
//         attribution: '© Google'
//       });

//       // Add default tile layer
//       googleSatellite.addTo(mapRef.current);
//       tileLayerRef.current = googleSatellite;

//       // Add layer control
//       L.control.layers({
//         "Satellite": googleSatellite,
//         "Streets": googleStreets
//       }).addTo(mapRef.current);

//       // Add initial marker
//       markerRef.current = L.marker([position.lat, position.lon])
//         .addTo(mapRef.current)
//         .bindPopup('You are here!')
//         .openPopup();

//       // Mark map as initialized
//       setMapInitialized(true);

//     } catch (error) {
//       console.error('Error initializing map:', error);
//     }
//   }, [position?.lat, position?.lon]);

//   // Debug position changes
//   useEffect(() => {
//     console.log('Position updated:', position);
//   }, [position]);

//   // 3. Update map view AND marker when position changes (only after map is initialized)
//   useEffect(() => {
//     // Check if map is properly initialized and available
//     if (!mapInitialized || !mapRef.current || !position || position.lat === 0 || position.lon === 0) {
//       return;
//     }

//     // Additional safety check - verify map instance is still valid
//     if (!mapRef.current._leaflet_id) {
//       console.warn('Map instance is no longer valid');
//       return;
//     }

//     try {
//       // Update map view smoothly
//       mapRef.current.setView([position.lat, position.lon], 18, {
//         animate: true,
//         duration: 1
//       });
      
//       // Update or create marker
//       if (markerRef.current) {
//         markerRef.current.setLatLng([position.lat, position.lon]);
//       } else {
//         markerRef.current = L.marker([position.lat, position.lon])
//           .addTo(mapRef.current)
//           .bindPopup('You are here!')
//           .openPopup();
//       }
//     } catch (error) {
//       console.error('Error updating map view:', error);
//     }
//   }, [position?.lat, position?.lon, mapInitialized]); // Add mapInitialized as dependency

//   // Cleanup on unmount
//   useEffect(() => {
//     return () => {
//       console.log('Cleaning up map resources...');
      
//       if (markerRef.current) {
//         markerRef.current.remove();
//         markerRef.current = null;
//       }
      
//       if (tileLayerRef.current) {
//         tileLayerRef.current.remove();
//         tileLayerRef.current = null;
//       }
      
//       if (mapRef.current) {
//         mapRef.current.remove();
//         mapRef.current = null;
//       }
      
//       setMapInitialized(false);
//     };
//   }, []);

//   if (!geolocationSupported) {
//     return (
//       <div style={{ padding: '20px', textAlign: 'center' }}>
//         <h2>Geolocation not supported</h2>
//         <p>Your browser does not support geolocation.</p>
//       </div>
//     );
//   }

//   if (!position) {
//     return (
//       <div style={{ padding: '20px', textAlign: 'center' }}>
//         <h2>Getting your location...</h2>
//         <p>Please allow location access and wait for GPS to initialize.</p>
//       </div>
//     );
//   }

//   return (
//     <div id="map" style={{ position: 'relative', height: '100vh', width: '100%' }}>
//       {/* Back to Home Button */}
//       <div style={{
//         position: 'absolute',
//         top: '20px',
//         left: '10px',
//         zIndex: 1000
//       }}>
//         <button
//           onClick={() => navigate("/")}
//           style={{
//             backgroundColor: '#2563eb',
//             color: 'white',
//             border: 'none',
//             borderRadius: '5px',
//             padding: '10px 15px',
//             cursor: 'pointer',
//             boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
//             fontWeight: 'bold'
//           }}
//         >
//           ← Back
//         </button>
//       </div>
      
//       {/* Debug info */}
//       <div style={{
//         position: 'absolute',
//         bottom: '20px',
//         left: '20px',
//         zIndex: 1000,
//         backgroundColor: 'rgba(255,255,255,0.9)',
//         padding: '10px',
//         borderRadius: '5px',
//         fontSize: '14px'
//       }}>
//         <div>Position: {position.lat.toFixed(6)}, {position.lon.toFixed(6)}</div>
//         <div>Accuracy: {position.acc?.toFixed(1)}m</div>
//         <div>Map: {mapInitialized ? 'Initialized' : 'Loading...'}</div>
//       </div>
//     </div>
//   );
// }

// export default MapView;






















// import React, { useEffect, useRef, useState } from 'react';
// import L from 'leaflet';
// import 'leaflet/dist/leaflet.css';
// import { useNavigate } from "react-router-dom";

// function MapView() {
//   const navigate = useNavigate();
//   const mapRef = useRef<L.Map | null>(null);
//   const [position, setPosition] = useState<{ lat: number; lon: number; acc: number } | null>(null);
//   const [geolocationSupported, setGeolocationSupported] = useState(true);

//   // Check geolocation support
//   useEffect(() => {
//     if (!navigator.geolocation) {
//       console.error("Geolocation not supported");
//       setGeolocationSupported(false);
//       return;
//     }
//   }, []);

//   // 1. Get LIVE LOCATION
//   useEffect(() => {
//     if (!navigator.geolocation) return;

//     const watchId = navigator.geolocation.watchPosition(
//       (position) => {
//         const { latitude: lat, longitude: lon, accuracy: acc } = position.coords;
//         if (acc > 100) {
//           console.warn('Low accuracy location ignored:', acc);
//           return;
//         }
//         setPosition({ lat, lon, acc });   
//       }, 
//       (error) => {
//         console.error('Location error:', error);
//         setGeolocationSupported(false);
//       },
//       { enableHighAccuracy: true, timeout: 5000, maximumAge: 3000 }, 
//     );
    
//     return () => navigator.geolocation.clearWatch(watchId);
//   }, []);

//   // 2. Initialize the map when position is available
//   useEffect(() => {
//     // Wait for valid coordinates
//     if (!position || position.lat === 0 || position.lon === 0) {
//       return;
//     }

//     const mapContainer = document.getElementById('map');
//     if (!mapContainer || mapRef.current) return;

//     console.log('Initializing map at:', position.lat, position.lon);
    
//     try {
//       mapRef.current = L.map('map').setView([position.lat, position.lon], 18);
      
//       // Use HTTPS
//       const googleSatellite = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
//         maxZoom: 20,
//         subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
//         attribution: '© Google'
//       });

//       const googleStreets = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
//         maxZoom: 20,
//         subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
//         attribution: '© Google'
//       });

//       googleSatellite.addTo(mapRef.current);

//       L.control.layers({
//         "Satellite": googleSatellite,
//         "Streets": googleStreets
//       }).addTo(mapRef.current);

//      // Add a marker at current position
//       L.marker([position.lat, position.lon])
//         .addTo(mapRef.current)
//         .bindPopup('You are here!')
//         .openPopup();




//     } catch (error) {
//       console.error('Error initializing map:', error);
//     }
 
//   }, [position?.lat, position?.lon]);


 

//   // 3. Update map view when position changes
//   useEffect(() => {
//     if (mapRef.current && position && position.lat !== 0 && position.lon !== 0) {
//       mapRef.current.setView([position.lat, position.lon], 18);
//     }
//   }, [position?.lat, position?.lon]);

//   // 4. Update Map View Marker 
//   useEffect(()=>{
//         // Add a marker at current position
//       L.marker([position!.lat, position!.lon])
//         .addTo(mapRef.current!)
//         .bindPopup('You are here!')
//         .openPopup();
//   },[position?.lat, position?.lon])


//   if (!geolocationSupported) {
//     return (
//       <div style={{ padding: '20px', textAlign: 'center' }}>
//         <h2>Geolocation not supported</h2>
//         <p>Your browser does not support geolocation.</p>
//       </div>
//     );
//   }

//   if (!position) {
//     return (
//       <div style={{ padding: '20px', textAlign: 'center' }}>
//         <h2>Getting your location...</h2>
//         <p>Please allow location access and wait for GPS to initialize.</p>
//       </div>
//     );
//   }

//   return (
//     <div id="map" style={{ position: 'relative', height: '100vh', width: '100%' }}>
//       {/* Back to Home Button */}
//       <div style={{
//         position: 'absolute',
//         top: '20px',
//         left: '10px',
//         zIndex: 1000
//       }}>
//         <button
//           onClick={() => navigate("/")}
//           style={{
//             backgroundColor: '#2563eb',
//             color: 'white',
//             border: 'none',
//             borderRadius: '5px',
//             padding: '10px 15px',
//             cursor: 'pointer',
//             boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
//             fontWeight: 'bold'
//           }}
//         >
//           ← Back
//         </button>
//       </div>
      
//       {/* Debug info */}
//       <div style={{
//         position: 'absolute',
//         bottom: '20px',
//         left: '20px',
//         zIndex: 1000,
//         backgroundColor: 'rgba(255,255,255,0.9)',
//         padding: '10px',
//         borderRadius: '5px'
//       }}>
//         Position: {position.lat.toFixed(6)}, {position.lon.toFixed(6)}
//       </div>
//     </div>
//   );
// }

// export default MapView;









