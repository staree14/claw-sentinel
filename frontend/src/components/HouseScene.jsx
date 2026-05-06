import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import useSystemStore from '../store/useSystemStore';
import { processEvent } from '../core/processEvent';
import { scenarios } from '../lib/constants';

const Person = forwardRef(({ position, color, scenario, ...props }, ref) => {
  const group = useRef();
  
  useImperativeHandle(ref, () => group.current);

  const leftLeg = useRef();
  const rightLeg = useRef();
  const leftArm = useRef();
  const rightArm = useRef();
  const body = useRef();
  
  const stateRef = useRef({ phase: 'walking_to_door', waitTime: 0 });
  const packageRef = useRef();

  useEffect(() => {
    stateRef.current = { phase: 'walking_to_door', waitTime: 0 };
    if (group.current) {
      group.current.rotation.y = 0;
      group.current.rotation.x = 0;
      group.current.position.y = 0;
    }
  }, [scenario]);

  useFrame((state, delta) => {
    if (!group.current) return;
    const z = group.current.position.z;
    const t = state.clock.elapsedTime;
    
    let speed = 2.0;
    let limbSwing = 0.6;
    let moving = true;
    
    if (scenario === 'intrusion') {
      // Intrusion: Starts at x = 1.5, jumps over fence
      if (z < -2) {
        group.current.position.z += 1.2 * delta;
        group.current.position.y = 0;
      } else if (z >= -2 && z < -1) {
        group.current.position.z += 1.5 * delta;
        const progress = (z - (-2)) / 1;
        group.current.position.y = Math.sin(progress * Math.PI) * 1.5;
        limbSwing = 0;
        if (leftArm.current) leftArm.current.rotation.x = -Math.PI / 1.5;
        if (rightArm.current) rightArm.current.rotation.x = -Math.PI / 1.5;
        if (leftLeg.current) leftLeg.current.rotation.x = Math.PI / 4;
        if (rightLeg.current) rightLeg.current.rotation.x = Math.PI / 4;
        moving = false;
      } else if (z >= -1 && z < 1.3) {
        // move diagonally towards door (x=0)
        group.current.position.x -= (group.current.position.x / 1.0) * delta * 1.5;
        const walkSpeed = Math.max(0.5, (1.3 - z) * 1.5);
        group.current.position.z += walkSpeed * delta;
        group.current.position.y = 0;
      } else {
        moving = false;
      }
    } else if (scenario === 'delivery') {
      const st = stateRef.current;
      if (!st.phase) st.phase = 'walking_to_door';
      
      if (st.phase === 'walking_to_door') {
        if (z < 1.0) {
          const walkSpeed = 1.5;
          group.current.position.z += walkSpeed * delta;
          group.current.position.y = 0;
          group.current.rotation.y = 0;
          limbSwing = 0.4;
          // hold package
          if (leftArm.current) leftArm.current.rotation.x = -Math.PI / 4;
          if (rightArm.current) rightArm.current.rotation.x = -Math.PI / 4;
        } else {
          st.phase = 'dropping';
          st.waitTime = 0;
        }
      } else if (st.phase === 'dropping') {
        st.waitTime += delta;
        moving = false;
        // bend down slightly
        group.current.position.y = -Math.sin(Math.min(st.waitTime, 1) * Math.PI) * 0.2; 
        if (st.waitTime > 1.0) {
          st.phase = 'walking_back';
          group.current.rotation.y = Math.PI; // turn around
        }
      } else if (st.phase === 'walking_back') {
        if (z > -6) {
          const walkSpeed = 1.5;
          group.current.position.z -= walkSpeed * delta;
          group.current.position.y = 0;
        } else {
          moving = false;
        }
      }
      
      if (packageRef.current) {
        packageRef.current.visible = st.phase !== 'walking_back';
      }
    } else {
      // Return: Walk straight through the gap
      if (z < 1.3) {
        const walkSpeed = Math.max(0.5, (1.3 - z) * 1.5);
        group.current.position.z += walkSpeed * delta;
        group.current.position.y = 0;
      } else {
        moving = false;
      }
    }

    if (moving) {
      if (leftLeg.current) leftLeg.current.rotation.x = Math.sin(t * speed * 3) * limbSwing;
      if (rightLeg.current) rightLeg.current.rotation.x = -Math.sin(t * speed * 3) * limbSwing;
      if (scenario !== 'delivery' || stateRef.current?.phase === 'walking_back') {
        if (leftArm.current) leftArm.current.rotation.x = -Math.sin(t * speed * 3) * limbSwing;
        if (rightArm.current) rightArm.current.rotation.x = Math.sin(t * speed * 3) * limbSwing;
      }
      if (body.current) body.current.position.y = 0.6 + Math.abs(Math.sin(t * speed * 3)) * 0.1;
    } else {
      if (leftLeg.current) leftLeg.current.rotation.x = 0;
      if (rightLeg.current) rightLeg.current.rotation.x = 0;
      if (scenario !== 'delivery' || stateRef.current?.phase === 'walking_back') {
        if (leftArm.current) leftArm.current.rotation.x = 0;
        if (rightArm.current) rightArm.current.rotation.x = 0;
      }
      if (body.current && scenario !== 'delivery') body.current.position.y = 0.6;
    }
  });

  return (
    <group ref={group} position={position} {...props}>
      <group ref={body} position={[0, 0.6, 0]}>
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshStandardMaterial color={color.head} />
        </mesh>
        <mesh position={[0, 0.1, 0]} castShadow>
          <boxGeometry args={[0.4, 0.6, 0.2]} />
          <meshStandardMaterial color={color.body} />
        </mesh>
        {scenario === 'delivery' && (
          <mesh ref={packageRef} position={[0, 0.1, 0.25]} castShadow>
            <boxGeometry args={[0.3, 0.25, 0.3]} />
            <meshStandardMaterial color="#8b5cf6" />
          </mesh>
        )}
        <group ref={leftArm} position={[-0.3, 0.3, 0]}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <boxGeometry args={[0.1, 0.5, 0.1]} />
            <meshStandardMaterial color={color.body} />
          </mesh>
        </group>
        <group ref={rightArm} position={[0.3, 0.3, 0]}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <boxGeometry args={[0.1, 0.5, 0.1]} />
            <meshStandardMaterial color={color.body} />
          </mesh>
        </group>
      </group>
      <group ref={leftLeg} position={[-0.15, 0.4, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <boxGeometry args={[0.12, 0.4, 0.12]} />
          <meshStandardMaterial color={color.legs} />
        </mesh>
      </group>
      <group ref={rightLeg} position={[0.15, 0.4, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <boxGeometry args={[0.12, 0.4, 0.12]} />
          <meshStandardMaterial color={color.legs} />
        </mesh>
      </group>
    </group>
  );
});

const Pet = forwardRef(({ position, ...props }, ref) => {
  const group = useRef();
  useImperativeHandle(ref, () => group.current);

  useFrame((state, delta) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime * 2;
    // Run in a circle in the yard
    group.current.position.x = Math.sin(t) * 2;
    group.current.position.z = Math.cos(t) * 1.5;
    group.current.rotation.y = t + Math.PI;
    // Bobbing
    group.current.position.y = Math.abs(Math.sin(t * 5)) * 0.1;
  });

  return (
    <group ref={group} position={position} {...props}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.2, 0.2, 0.4]} />
        <meshStandardMaterial color="#b45309" />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.3, 0.2]} castShadow>
        <boxGeometry args={[0.15, 0.15, 0.15]} />
        <meshStandardMaterial color="#92400e" />
      </mesh>
    </group>
  );
});

function DeliveryVan() {
  return (
    <group position={[0, 0.75, -5.5]} rotation={[0, Math.PI / 2, 0]}>
      {/* Body */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[3, 1.5, 1.5]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Cabin */}
      <mesh position={[1.5, 0.25, 0]} castShadow>
        <boxGeometry args={[1, 1, 1.5]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      {/* Wheels */}
      {[-1, 1].map((x) => 
        [-0.75, 0.75].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, -0.25, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        ))
      )}
      <mesh position={[1.5, -0.25, 0.75]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[1.5, -0.25, -0.75]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      {/* Logo/Text */}
      <mesh position={[0, 0.5, 0.76]}>
        <planeGeometry args={[1.5, 0.5]} />
        <meshBasicMaterial color="#3b82f6" />
      </mesh>
    </group>
  );
}

function CCTV() {
  const camRef = useRef();

  useFrame((state) => {
    if (camRef.current) {
      camRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.5;
    }
  });

  return (
    <group position={[1.5, 2.5, 1.1]}>
      <mesh>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <group ref={camRef}>
        <mesh position={[0, 0, -0.2]} rotation={[Math.PI / 6, 0, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.4, 16]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
        <mesh position={[0, -0.05, -0.4]} rotation={[Math.PI / 6, 0, 0]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      </group>
    </group>
  );
}

function MotionSensor({ triggered, scenario }) {
  let color = "#10b981"; // idle green
  if (triggered) {
    if (scenario === 'intrusion') color = "#ef4444";
    else if (scenario === 'delivery') color = "#f59e0b";
    else if (scenario === 'pet') color = "#fcd34d";
    else if (scenario === 'return') color = "#3b82f6";
  }

  return (
    <group position={[-0.8, 1.8, 1.05]}>
      <mesh>
        <boxGeometry args={[0.15, 0.25, 0.1]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0, 0, -0.06]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={triggered ? 2 : 0.5} 
        />
      </mesh>
    </group>
  );
}

function ScenarioSimulation() {
  const activeScenario = useSystemStore(state => state.activeScenario);
  const [triggered, setTriggered] = useState(false);
  const actorRef = useRef();
  const doorRef = useRef();

  // Reset trigger when scenario changes
  useEffect(() => {
    setTriggered(false);
    if (actorRef.current) {
      if (activeScenario === 'intrusion') {
        actorRef.current.position.set(1.5, 0, -5);
      } else if (activeScenario === 'delivery' || activeScenario === 'return') {
        actorRef.current.position.set(0, 0, -5);
      } else if (activeScenario === 'pet') {
        actorRef.current.position.set(0, 0, 0);
      }
    }
    if (doorRef.current) {
      doorRef.current.rotation.y = 0;
    }
  }, [activeScenario]);

  useFrame((state, delta) => {
    if (actorRef.current && !triggered && activeScenario !== 'pet') {
      if (activeScenario === 'delivery') {
        if (actorRef.current.rotation.y > 1.0) { // Dropped package and turned around
          setTriggered(true);
        }
      } else {
        if (actorRef.current.position.z >= 1.3) {
          setTriggered(true);
        }
      }
    } else if (activeScenario === 'pet' && !triggered) {
      // Pet triggers randomly/quickly
      if (state.clock.elapsedTime > 2) {
        setTriggered(true);
      }
    }

    // Door open animation for 'return'
    if (triggered && activeScenario === 'return' && doorRef.current) {
      doorRef.current.rotation.y = Math.min(doorRef.current.rotation.y + delta * 2, Math.PI / 2);
    }
  });

  const getActor = () => {
    switch (activeScenario) {
      case 'intrusion':
        return <Person ref={actorRef} position={[1.5, 0, -5]} scenario="intrusion" color={{ head: "#10b981", body: "#064e3b", legs: "#022c22" }} />;
      case 'delivery':
        return <Person ref={actorRef} position={[0, 0, -5]} scenario="delivery" color={{ head: "#3b82f6", body: "#1d4ed8", legs: "#1e3a8a" }} />;
      case 'return':
        return <Person ref={actorRef} position={[0, 0, -5]} scenario="return" color={{ head: "#f59e0b", body: "#b45309", legs: "#78350f" }} />;
      case 'pet':
        return <Pet ref={actorRef} position={[0, 0, 0]} />;
      default:
        return null;
    }
  };

  const bannerStyles = {
    red: "bg-red-500/20 border-red-500 text-red-400",
    yellow: "bg-amber-500/20 border-amber-500 text-amber-400",
    amber: "bg-orange-500/20 border-orange-500 text-orange-400",
    blue: "bg-blue-500/20 border-blue-500 text-blue-400",
  };

  const bannerColor = 
    activeScenario === 'intrusion' ? bannerStyles.red : 
    activeScenario === 'delivery' ? bannerStyles.yellow : 
    activeScenario === 'pet' ? bannerStyles.amber : bannerStyles.blue;

  const isDaytime = activeScenario === 'delivery';

  return (
    <group>
      {/* House Body */}
      <mesh position={[0, 1.5, 3]}>
        <boxGeometry args={[8, 3.5, 4]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>

      {/* Door */}
      <group position={[-0.6, 1, 1.0]} ref={doorRef}>
        <mesh position={[0.6, 0, 0]} receiveShadow castShadow>
          <boxGeometry args={[1.2, 2, 0.1]} />
          <meshStandardMaterial color={triggered && activeScenario === 'intrusion' ? "#ef4444" : "#475569"} />
          {triggered && activeScenario !== 'return' && (
            <Html position={[0, 1.5, 0]} center>
              <div className={`${bannerColor} border px-3 py-1 rounded font-mono text-xs tracking-widest backdrop-blur-md whitespace-nowrap animate-pulse`}>
                {activeScenario === 'intrusion' ? "MOTION DETECTED" : 
                 activeScenario === 'delivery' ? "DELIVERY ARRIVED" : 
                 "PET DETECTED"}
              </div>
            </Html>
          )}
        </mesh>
      </group>

      {/* Package (Delivery) */}
      {activeScenario === 'delivery' && triggered && (
        <mesh position={[0.3, 0.1, 1.2]} castShadow>
          <boxGeometry args={[0.3, 0.2, 0.3]} />
          <meshStandardMaterial color="#8b5cf6" />
        </mesh>
      )}

      {/* Fence (with gap in middle) */}
      <group position={[0, 0.5, -1.5]}>
        {[-3, -2, -1, 1, 2, 3].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.2, 1.2, 0.1]} />
            <meshStandardMaterial color="#451a03" />
          </mesh>
        ))}
        {/* Left rail */}
        <mesh position={[-1.5, 0.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 0.1, 0.1]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
        <mesh position={[-1.5, -0.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 0.1, 0.1]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
        {/* Right rail */}
        <mesh position={[1.5, 0.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 0.1, 0.1]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
        <mesh position={[1.5, -0.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 0.1, 0.1]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
      </group>

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color={isDaytime ? "#16a34a" : "#0f172a"} />
      </mesh>

      <CCTV />
      <MotionSensor triggered={triggered} scenario={activeScenario} />
      
      {getActor()}
      {activeScenario === 'delivery' && <DeliveryVan />}
      
      {/* Lights */}
      <ambientLight intensity={isDaytime ? 1.0 : 0.2} />
      <directionalLight position={[5, 10, -5]} intensity={isDaytime ? 2.5 : 1.5} castShadow={!isDaytime} />
      {isDaytime && <directionalLight position={[-5, 10, 5]} intensity={1.5} castShadow />}
      <pointLight 
        position={[0, 2, 1.5]} 
        intensity={triggered ? 2 : (isDaytime ? 0 : 0.5)} 
        color={
          triggered ? (
            activeScenario === 'intrusion' ? "#ef4444" : 
            activeScenario === 'delivery' ? "#f59e0b" : 
            activeScenario === 'return' ? "#3b82f6" : "#fcd34d"
          ) : "#ffffff"
        } 
      />
    </group>
  );
}

export default function HouseScene() {
  const activeScenario = useSystemStore(state => state.activeScenario);
  const isDaytime = activeScenario === 'delivery';
  const bgColor = isDaytime ? '#87CEEB' : '#0B0F14';

  return (
    <Canvas shadows camera={{ position: [6, 4, -7], fov: 45 }}>
      <color attach="background" args={[bgColor]} />
      <fog attach="fog" args={[bgColor, 5, isDaytime ? 25 : 15]} />
      <ScenarioSimulation />
      <OrbitControls maxPolarAngle={Math.PI / 2 - 0.1} />
    </Canvas>
  );
}
