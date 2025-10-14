# loop_detection.py (fixed)
import sys
import json
from shapely.geometry import LineString, Point, Polygon
from shapely.ops import polygonize, unary_union
from pyproj import Transformer
from typing import List, Dict, Tuple

def _extract_lon_lat(pt: Dict) -> Tuple[float, float]:
    """Extract longitude and latitude from a point dictionary"""
    return pt.get('lng', pt.get('lon', 0.0)), pt.get('lat', 0.0)

def project_coords(coords: List[Tuple[float, float]], from_crs: str = "EPSG:4326", to_crs: str = "EPSG:3857") -> List[Tuple[float, float]]:
    """Project coordinates from one CRS to another"""
    transformer = Transformer.from_crs(from_crs, to_crs, always_xy=True)
    projected = []
    for lon, lat in coords:
        x, y = transformer.transform(lon, lat)
        projected.append((x, y))
    return projected

def detect_closed_loops(userpath: List[Dict], tolerance: float = 1e-6, project_to_meters: bool = True, projected_crs: str = "EPSG:3857") -> Dict:
    """Detect if the user path forms closed loops/polygons"""
    
    if len(userpath) < 3:
        return {"closed_loops": False, "polygons": []}
    
    # Extract coordinates
    coords = [_extract_lon_lat(pt) for pt in userpath]
    
    # Check if first and last points are the same (within tolerance)
    first_point = coords[0]
    last_point = coords[-1]
    
    # Calculate distance between first and last points
    distance = ((first_point[0] - last_point[0])**2 + (first_point[1] - last_point[1])**2)**0.5
    
    # If points are close enough, consider it closed
    if distance <= tolerance:
        try:
            # Create a LineString from coordinates
            line = LineString(coords)
            
            # Check if it forms a ring (closed loop)
            if line.is_ring:
                # Try to create a polygon
                polygon = Polygon(coords)
                
                if polygon.is_valid and polygon.area > 0:
                    return {
                        "closed_loops": True,
                        "polygons": [{
                            "coordinates": coords,
                            "area": polygon.area,
                            "is_valid": True
                        }]
                    }
        except Exception as e:
            print(f"Error in geometry creation: {e}", file=sys.stderr)
    
    # Alternative approach: Force closure and check
    try:
        # Force the loop to be closed by making last point equal to first
        forced_coords = coords.copy()
        forced_coords[-1] = forced_coords[0]
        
        polygon = Polygon(forced_coords)
        if polygon.is_valid and polygon.area > 0:
            return {
                "closed_loops": True,
                "polygons": [{
                    "coordinates": forced_coords,
                    "area": polygon.area,
                    "is_valid": True
                }]
            }
    except Exception as e:
        print(f"Error in forced closure: {e}", file=sys.stderr)
    
    return {"closed_loops": False, "polygons": []}

def main():
    # Read input from stdin
    input_data = sys.stdin.read()
    try:
        data = json.loads(input_data)
        userpath = data.get("userpath", [])
        tolerance = data.get("tolerance", 1e-6)

        # Perform loop detection
        result = detect_closed_loops(userpath, tolerance=tolerance)

        # Output the result as JSON
        print(json.dumps(result))
        
    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid JSON input: {e}"}))
    except Exception as e:
        print(json.dumps({"error": f"Processing error: {e}"}))

if __name__ == "__main__":
    main()