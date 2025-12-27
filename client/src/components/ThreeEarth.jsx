import { useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { TextureLoader } from 'three';
// Textures
const EARTH_TEXTURE_URL = "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg";
const EARTH_BUMP_URL = "https://unpkg.com/three-globe/example/img/earth-topology.png";
function Earth() {
    const earthRef = useRef(null);
    const [colorMap, bumpMap] = useLoader(TextureLoader, [EARTH_TEXTURE_URL, EARTH_BUMP_URL]);
    useFrame(({ clock }) => {
        if (earthRef.current) {
            earthRef.current.rotation.y = clock.getElapsedTime() * 0.1;
        }
    });
    return (<group>
            <mesh ref={earthRef} scale={[2.5, 2.5, 2.5]}>
                <sphereGeometry args={[1, 64, 64]}/>
                <meshStandardMaterial map={colorMap} bumpMap={bumpMap} bumpScale={0.05} metalness={0.4} roughness={0.7}/>
            </mesh>

            {/* Atmosphere Glow Effect (generic) */}
            <mesh scale={[2.6, 2.6, 2.6]}>
                <sphereGeometry args={[1, 64, 64]}/>
                <meshBasicMaterial color="#4db2ff" transparent opacity={0.1} side={THREE.BackSide} blending={THREE.AdditiveBlending}/>
            </mesh>
        </group>);
}
export default function ThreeEarth({ onInteract }) {
    return (<div className="w-full h-full relative" onMouseDown={onInteract} onTouchStart={onInteract}>
            <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
                <ambientLight intensity={1.5}/>
                <pointLight position={[10, 10, 10]} intensity={2}/>
                <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1}/>
                <Earth />
                <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 2.5} maxPolarAngle={Math.PI / 1.5} autoRotate={false}/>
            </Canvas>
        </div>);
}
