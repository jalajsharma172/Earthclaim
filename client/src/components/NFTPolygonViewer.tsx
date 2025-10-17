import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

interface PathPoint {
  lat: number;
  lon: number;
}

interface LocationState {
  ipfsHash: string;
}

const NFTPolygonViewer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const mapRef = useRef<L.Map | null>(null);
  const polygonRef = useRef<L.Polygon | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>(""); 

  // Initialize map on component mount
  useEffect(() => {
    const map = L.map('nft-polygon-map').setView([28.7041, 77.1025], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Handle polygon display whenever location state changes
  useEffect(() => {
    const state = location.state as LocationState;

    const displayPolygon = async () => {
      if (!state?.ipfsHash || !mapRef.current) {
        setError("No IPFS hash provided or map not initialized");
        return;
      }

      setLoading(true);
      setError("");

      try {
        // Fetch text file from IPFS
        const response = await axios.get(`https://ipfs.io/ipfs/${state.ipfsHash}`, {
          responseType: "text" // Ensure we get raw text
        });

        // Parse JSON from text
        let coordinates: PathPoint[] = [];
        let valid = false;
        try {
          coordinates = JSON.parse(response.data);
          valid = Array.isArray(coordinates) &&
                  coordinates.length > 2 &&
                  coordinates.every(point =>
                    typeof point.lat === 'number' &&
                    typeof point.lon === 'number'
                  );
        if(valid){  
            console.log(coordinates);
        }else{
            console.log(coordinates);
        }

        } catch (parseError) {
          console.error('Error parsing JSON:', parseError);
        }

        if (!valid) {
          setError("Polygon coordinates not found or invalid format.");
          setLoading(false);
          return;
        }

        // Clear previous polygon and markers
        if (polygonRef.current) polygonRef.current.remove();
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        // Map coordinates
        const latLngs = coordinates.map(point => [point.lat, point.lon] as L.LatLngTuple);

        // Add polygon
        const polygon = L.polygon(latLngs, {
          color: '#22c55e',
          weight: 3,
          fillColor: '#4ade80',
          fillOpacity: 0.2,
        }).addTo(mapRef.current);
        polygonRef.current = polygon;

        // Add markers at vertices
        coordinates.forEach((point, index) => {
          const marker = L.marker([point.lat, point.lon])
            .bindPopup(`Point ${index + 1}: (${point.lat}, ${point.lon})`)
            .addTo(mapRef.current!);
          markersRef.current.push(marker);
        });

        // Fit map to polygon bounds
        const bounds = polygon.getBounds();
        mapRef.current.fitBounds(bounds, { padding: [20, 20], maxZoom: 17 });

      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load polygon from IPFS');
      } finally {
        setLoading(false);
      }
    };

    displayPolygon();
  }, [location.state]);

  return (
    <div className="h-screen w-full flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-md p-4 z-10 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
        >
          ← Back
        </button>
        <h1 className="text-xl font-semibold">NFT Polygon Viewer</h1>
        <div className="w-20"></div>
      </div>

      {/* Main content */}
      <div className="relative flex-1">
        <div id="nft-polygon-map" className="absolute inset-0"></div>

        {loading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-4 flex items-center gap-3">
              <div className="w-6 h-6 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading polygon data...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute top-4 left-4 right-4 flex justify-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg max-w-md">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-md">
          <h3 className="font-semibold mb-2 text-sm">Legend</h3>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500"></div>
              <span>Boundary</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-200"></div>
              <span>Area</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 flex items-center justify-center">📍</div>
              <span>Vertices</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NFTPolygonViewer;
