# loop_detection.py (fixed)
import sys
import json
from shapely.geometry import LineString, Point, Polygon
from shapely.ops import polygonize, unary_union
from pyproj import Transformer
from typing import List, Dict, Tuple
from shapely.geometry import LineString, Polygon, MultiPolygon
from shapely.ops import unary_union

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

 from shapely.geometry import LineString, Polygon, MultiPolygon
from shapely.ops import unary_union

def detect_closed_loops(
    userpath: List[Dict],
    tolerance: float = 10.0,
    project_to_meters: bool = True,
    projected_crs: str = "EPSG:3857"
) -> Dict:
    if len(userpath) < 3:
        return {"closed_loops": False, "polygons": []}

    coords = [_extract_lon_lat(pt) for pt in userpath]

    # Project to meters if needed
    projected_coords = project_coords(coords, "EPSG:4326", projected_crs) if project_to_meters else coords

    # 🧹 Remove exact duplicates
    cleaned = []
    for c in projected_coords:
        if not cleaned or c != cleaned[-1]:
            cleaned.append(c)

    if len(cleaned) < 3:
        return {"closed_loops": False, "polygons": []}

    first_point, last_point = cleaned[0], cleaned[-1]
    distance = ((first_point[0]-last_point[0])**2 + (first_point[1]-last_point[1])**2)**0.5
    print(f"Loop closure distance: {distance:.2f} m", file=sys.stderr)

    # Force closure if within tolerance
    if distance > tolerance:
        cleaned.append(cleaned[0])

    try:
        line = LineString(cleaned)
        polygon = Polygon(line)

        # Auto-fix invalid polygon
        if not polygon.is_valid:
            polygon = polygon.buffer(0)

        if polygon.is_valid and polygon.area > 0:
            return {
                "closed_loops": True,
                "polygons": [{
                    "coordinates": coords,
                    "area_m2": polygon.area,
                    "is_valid": True
                }]
            }
    except Exception as e:
        print(f"Polygon creation failed: {e}", file=sys.stderr)

    return {"closed_loops": False, "polygons": []}


def main():
    # Read input from stdin
    input_data = sys.stdin.read()
    try:
        data = json.loads(input_data)
        userpath = data.get("userpath", [])
        tolerance = data.get("tolerance", 10.0)

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