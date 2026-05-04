import React, { useRef, useEffect, Suspense, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, useAnimations, Html } from "@react-three/drei";
import * as THREE from "three";

const INTRUDER_URL = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb";

const StreetLight = ({ position }) => {
  return (
    <group position={position}>
      {/* Pole */}
      <mesh position={[0, 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.05, 0.1, 4, 8]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Arm */}
      <mesh position={[0.5, 3.9, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[0.03, 0.05, 1, 8]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Bulb casing */}
      <mesh position={[0.9, 3.85, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.3, 0.1, 0.2]} />
        <meshStandardMaterial color="#0f0f1a" />
      </mesh>
      {/* Bulb emissive */}
      <mesh position={[0.9, 3.79, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.2, 0.1]} />
        <meshBasicMaterial color="#fde047" />
      </mesh>
      {/* Light */}
      <pointLight position={[0.9, 3.7, 0]} distance={12} intensity={8} color="#fde047" castShadow shadow-mapSize={[512, 512]} />
    </group>
  );
};

const DetailedHouse = () => {
  return (
    <group position={[-2, 0, -3]}>
      {/* Main Body */}
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[5, 3, 4]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.9} />
      </mesh>
      
      {/* Garage */}
      <mesh position={[3.5, 1, 0.5]} castShadow receiveShadow>
        <boxGeometry args={[3, 2, 3]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
      </mesh>
      <mesh position={[3.5, 1, 2.01]} castShadow receiveShadow>
        <planeGeometry args={[2.2, 1.5]} />
        <meshStandardMaterial color="#475569" roughness={0.5} />
      </mesh>

      {/* Main Roof */}
      <mesh position={[0, 3.8, 0]} castShadow receiveShadow>
        <coneGeometry args={[4, 1.6, 4, 1]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>

      {/* Garage Roof */}
      <mesh position={[3.5, 2.5, 0.5]} castShadow receiveShadow>
        <coneGeometry args={[2.5, 1, 4, 1]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>

      {/* Front Door */}
      <mesh position={[-0.5, 1, 2.01]} castShadow receiveShadow>
        <planeGeometry args={[0.8, 1.6]} />
        <meshStandardMaterial color="#451a03" roughness={0.6} />
      </mesh>
      {/* Door Knob */}
      <mesh position={[-0.2, 1, 2.05]} castShadow>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Windows */}
      <group>
        {/* Window 1 */}
        <mesh position={[1.2, 1.5, 2.01]} castShadow>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
        {/* Window 1 Frame */}
        <mesh position={[1.2, 1.5, 2.02]} castShadow>
          <boxGeometry args={[1.1, 1.1, 0.05]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[1.2, 1.5, 2.03]}>
          <boxGeometry args={[0.05, 1.1, 0.02]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[1.2, 1.5, 2.03]}>
          <boxGeometry args={[1.1, 0.05, 0.02]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      </group>

      {/* Second Story Window */}
      <group position={[0, 1.2, 0]}>
        <mesh position={[0, 1.5, 2.01]} castShadow>
          <planeGeometry args={[0.8, 0.8]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
        <mesh position={[0, 1.5, 2.02]} castShadow>
          <boxGeometry args={[0.9, 0.9, 0.05]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      </group>

      {/* Porch Steps */}
      <mesh position={[-0.5, 0.1, 2.3]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.2, 0.6]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>

      {/* Bushes */}
      <mesh position={[1.2, 0.5, 2.5]} castShadow receiveShadow>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshStandardMaterial color="#064e3b" roughness={0.8} />
      </mesh>
      <mesh position={[2, 0.4, 2.4]} castShadow receiveShadow>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="#064e3b" roughness={0.8} />
      </mesh>
      <mesh position={[-1.8, 0.5, 2.5]} castShadow receiveShadow>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#064e3b" roughness={0.8} />
      </mesh>

      {/* Spotlight mimicking porch light */}
      <spotLight position={[-0.5, 2, 2.2]} angle={0.5} penumbra={1} intensity={10} color="#fef08a" target-position={[-0.5, 0, 3]} />
    </group>
  );
};

const IntruderModel = () => {
  const group = useRef();
  const { scene, animations } = useGLTF(INTRUDER_URL);
  const { actions } = useAnimations(animations, group);

  // Clone scene to avoid conflicts
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });
  }, [clonedScene]);

  useEffect(() => {
    // Play the walking animation
    const actionName = Object.keys(actions)[0];
    if (actionName && actions[actionName]) {
      actions[actionName].play();
      // Speed up animation a bit for the dramatic entry
      actions[actionName].setEffectiveTimeScale(1.5);
    }
  }, [actions]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() % 5; // 5 second loop
    if (!group.current) return;
    
    if (t < 2) {
      // approaching the fence
      group.current.position.z = 6 - t * 2.5; // Moves from z=6 to z=1
      group.current.position.y = 0;
      // face forward
      group.current.rotation.y = Math.PI;
    } else if (t < 3) {
      // jumping over the fence
      const jt = t - 2;
      group.current.position.z = 1 - jt * 3; // Moves from z=1 to z=-2
      group.current.position.y = Math.sin(jt * Math.PI) * 1.5; // Arc height
      group.current.rotation.y = Math.PI;
    } else if (t < 4.5) {
      // running away towards the house
      const rt = t - 3;
      group.current.position.z = -2 - rt * 2;
      group.current.position.y = 0;
      group.current.rotation.y = Math.PI + (Math.PI / 8); // turn slightly towards house
    } else {
      // resetting out of view
      group.current.position.y = -10;
    }
  });

  return (
    <group ref={group} position={[0, 0, 6]}>
      <primitive object={clonedScene} scale={[1.2, 1.2, 1.2]} />
    </group>
  );
};

const LoadingFallback = () => (
  <Html center>
    <div className="text-cyan-400 text-xs font-mono tracking-widest bg-black/80 px-4 py-2 rounded border border-cyan-900/50 flex items-center gap-2">
      <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      CONNECTING...
    </div>
  </Html>
);

export default function IntrusionScene() {
  return (
    <div className="h-full w-full min-h-[240px] rounded-lg overflow-hidden relative border border-white/5 bg-black">
      <Canvas camera={{ position: [7, 5, 8], fov: 45 }} shadows>
        <color attach="background" args={["#05080c"]} />
        <fog attach="fog" args={["#05080c", 5, 20]} />
        
        <ambientLight intensity={0.05} />
        <spotLight 
          position={[0, 8, 5]} 
          angle={0.4} 
          penumbra={1} 
          intensity={15} 
          color="#00e5ff"
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        
        <Suspense fallback={<LoadingFallback />}>
          <DetailedHouse />
          <IntruderModel />
        </Suspense>
        
        {/* Security Fence */}
        <group position={[0, 0.5, 1]}>
          {[-5, -2.5, 0, 2.5, 5].map((x, i) => (
            <mesh key={i} position={[x, 0, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.15, 1.5, 0.15]} />
              <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
            </mesh>
          ))}
          <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
            <boxGeometry args={[12, 0.05, 0.05]} />
            <meshStandardMaterial color="#222" metalness={0.8} />
          </mesh>
          <mesh position={[0, -0.4, 0]} castShadow receiveShadow>
            <boxGeometry args={[12, 0.05, 0.05]} />
            <meshStandardMaterial color="#222" metalness={0.8} />
          </mesh>
        </group>
        
        {/* Street Lights */}
        <StreetLight position={[-4, 0, 5]} />
        <StreetLight position={[3, 0, 5]} />
        
        {/* Ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[30, 30]} />
          <meshStandardMaterial color="#080808" />
        </mesh>
        
        {/* Grid helper for that high-tech radar feel */}
        <gridHelper args={[30, 30, "#1a3a4a", "#0a1a2a"]} position={[0, 0.01, 0]} />
        
        <OrbitControls 
          enablePan={false} 
          enableZoom={true} 
          minDistance={3}
          maxDistance={12}
          minPolarAngle={Math.PI / 6} 
          maxPolarAngle={Math.PI / 2.1} 
          minAzimuthAngle={-Math.PI / 4}
          maxAzimuthAngle={Math.PI / 2}
        />
      </Canvas>
      <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur text-[10px] text-cyan-400 font-mono rounded border border-cyan-500/30 uppercase tracking-wider">
        <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2"></span>
        Cam 03 • Perimeter
      </div>
    </div>
  );
}

// Preload models for faster loading
useGLTF.preload(INTRUDER_URL);
