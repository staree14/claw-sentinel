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
    const initialPhase = scenario === 'intrusion' ? 'sneaking' : 'walking_to_door';
    stateRef.current = { phase: initialPhase, waitTime: 0 };
    if (group.current) {
      group.current.rotation.y = 0;
      group.current.rotation.x = 0;
      group.current.position.y = 0;
      group.current.visible = true;
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
      const st = stateRef.current;
      if (!st.phase) st.phase = 'sneaking';

      if (st.phase === 'sneaking') {
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
          st.phase = 'spotted';
          st.waitTime = 0;
          moving = false;
        }
      } else if (st.phase === 'spotted') {
        moving = false;
        st.waitTime += delta;
        // Freeze with hands up
        if (leftArm.current) leftArm.current.rotation.x = -Math.PI;
        if (rightArm.current) rightArm.current.rotation.x = -Math.PI;
        if (st.waitTime > 0.8) {
          st.phase = 'running_away';
          group.current.rotation.y = Math.PI; // turn around
        }
      } else if (st.phase === 'running_away') {
        speed = 4.5; // sprint fast
        limbSwing = 1.2;
        group.current.position.z -= 4.0 * delta;
        
        // Vault over the gate
        if (z < -0.5 && z > -2.5) {
          const progress = (z - (-0.5)) / -2.0; 
          group.current.position.y = Math.sin(progress * Math.PI) * 1.5;
          limbSwing = 0;
          if (leftLeg.current) leftLeg.current.rotation.x = -Math.PI / 4;
          if (rightLeg.current) rightLeg.current.rotation.x = Math.PI / 4;
        } else {
          group.current.position.y = 0;
        }

        if (z < -6) {
          group.current.visible = false;
          moving = false;
        }
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
      // Return: Walk to door, wait for it to open, then walk inside
      const st = stateRef.current;
      if (!st.phase || st.phase === 'walking_to_door') {
        st.phase = 'walking_to_door';
        if (z < 0.8) {
          const walkSpeed = 1.5;
          group.current.position.z += walkSpeed * delta;
          group.current.position.y = 0;
        } else {
          st.phase = 'waiting';
          st.waitTime = 0;
          moving = false;
        }
      } else if (st.phase === 'waiting') {
        moving = false;
        st.waitTime += delta;
        if (st.waitTime > 1.0) { // wait for door to open
          st.phase = 'walking_inside';
        }
      } else if (st.phase === 'walking_inside') {
        if (z < 2.5) {
          const walkSpeed = 1.5;
          group.current.position.z += walkSpeed * delta;
          group.current.position.y = 0;
        } else {
          moving = false;
          group.current.visible = false;
        }
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
        if (stateRef.current?.phase !== 'spotted') {
          if (leftArm.current) leftArm.current.rotation.x = 0;
          if (rightArm.current) rightArm.current.rotation.x = 0;
        }
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

  const frontLeftLeg = useRef();
  const frontRightLeg = useRef();
  const backLeftLeg = useRef();
  const backRightLeg = useRef();
  const tail = useRef();

  const stateRef = useRef({ phase: 'walking', waitTime: 0, targetX: 1, targetZ: 1 });

  useFrame((state, delta) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    const st = stateRef.current;
    
    let moving = true;
    let speed = 1.5;

    if (st.phase === 'walking') {
      const dx = st.targetX - group.current.position.x;
      const dz = st.targetZ - group.current.position.z;
      const dist = Math.sqrt(dx*dx + dz*dz);
      
      if (dist < 0.1) {
        st.phase = 'sniffing';
        st.waitTime = 0;
        moving = false;
      } else {
        // Move towards target
        const moveX = (dx / dist) * delta * speed;
        const moveZ = (dz / dist) * delta * speed;
        group.current.position.x += moveX;
        group.current.position.z += moveZ;
        
        // Smooth rotation
        const targetRotation = Math.atan2(dx, dz);
        const currentRot = group.current.rotation.y;
        let diff = targetRotation - currentRot;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        group.current.rotation.y += diff * delta * 8;
      }
    } else if (st.phase === 'sniffing') {
      st.waitTime += delta;
      moving = false;
      if (st.waitTime > 3.0) {
        st.phase = 'walking';
        // Pick new random target within yard bounds x: [-2, 2], z: [-1, 2]
        st.targetX = (Math.random() - 0.5) * 4;
        st.targetZ = (Math.random() - 0.5) * 3 + 0.5;
      }
    }

    // Animation
    if (moving) {
      // Trot animation
      const trot = t * speed * 5;
      if (frontLeftLeg.current) frontLeftLeg.current.rotation.x = Math.sin(trot) * 0.4;
      if (backRightLeg.current) backRightLeg.current.rotation.x = Math.sin(trot) * 0.4;
      if (frontRightLeg.current) frontRightLeg.current.rotation.x = -Math.sin(trot) * 0.4;
      if (backLeftLeg.current) backLeftLeg.current.rotation.x = -Math.sin(trot) * 0.4;
      
      // Bobbing
      group.current.position.y = Math.abs(Math.sin(trot * 2)) * 0.03;
      group.current.rotation.x = 0; // Reset pitch
      
      // Tail wag
      if (tail.current) tail.current.rotation.z = Math.sin(trot * 2) * 0.2;
    } else {
      // Reset legs
      if (frontLeftLeg.current) frontLeftLeg.current.rotation.x = 0;
      if (backRightLeg.current) backRightLeg.current.rotation.x = 0;
      if (frontRightLeg.current) frontRightLeg.current.rotation.x = 0;
      if (backLeftLeg.current) backLeftLeg.current.rotation.x = 0;
      
      // Sniffing animation
      if (st.phase === 'sniffing') {
        group.current.position.y = -0.05; 
        group.current.rotation.x = Math.sin(t * 3) * 0.05 + 0.1; // head down
        if (tail.current) tail.current.rotation.z = Math.sin(t * 10) * 0.3; // rapid wag tail while sniffing
      } else {
        group.current.position.y = 0;
        group.current.rotation.x = 0;
      }
    }
  });

  return (
    <group ref={group} position={position} {...props}>
      {/* Body */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[0.15, 0.15, 0.3]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 0.35, 0.15]} castShadow>
        <boxGeometry args={[0.12, 0.12, 0.15]} />
        <meshStandardMaterial color="#A0522D" />
      </mesh>
      {/* Ears */}
      <mesh position={[-0.05, 0.42, 0.1]} castShadow>
        <boxGeometry args={[0.04, 0.06, 0.04]} />
        <meshStandardMaterial color="#4A2511" />
      </mesh>
      <mesh position={[0.05, 0.42, 0.1]} castShadow>
        <boxGeometry args={[0.04, 0.06, 0.04]} />
        <meshStandardMaterial color="#4A2511" />
      </mesh>
      {/* Snout */}
      <mesh position={[0, 0.32, 0.23]} castShadow>
        <boxGeometry args={[0.06, 0.06, 0.08]} />
        <meshStandardMaterial color="#4A2511" />
      </mesh>

      {/* Tail */}
      <group ref={tail} position={[0, 0.3, -0.15]}>
        <mesh position={[0, 0.05, -0.05]} rotation={[Math.PI / 4, 0, 0]} castShadow>
          <boxGeometry args={[0.03, 0.15, 0.03]} />
          <meshStandardMaterial color="#A0522D" />
        </mesh>
      </group>

      {/* Legs */}
      <group ref={frontLeftLeg} position={[-0.05, 0.25, 0.1]}>
        <mesh position={[0, -0.1, 0]} castShadow>
          <boxGeometry args={[0.04, 0.2, 0.04]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
      </group>
      <group ref={frontRightLeg} position={[0.05, 0.25, 0.1]}>
        <mesh position={[0, -0.1, 0]} castShadow>
          <boxGeometry args={[0.04, 0.2, 0.04]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
      </group>
      <group ref={backLeftLeg} position={[-0.05, 0.25, -0.1]}>
        <mesh position={[0, -0.1, 0]} castShadow>
          <boxGeometry args={[0.04, 0.2, 0.04]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
      </group>
      <group ref={backRightLeg} position={[0.05, 0.25, -0.1]}>
        <mesh position={[0, -0.1, 0]} castShadow>
          <boxGeometry args={[0.04, 0.2, 0.04]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
      </group>
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
  const gateLeftRef = useRef();
  const gateRightRef = useRef();
  const lightRef = useRef();

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
      } else if (activeScenario === 'return') {
        if (actorRef.current.position.z >= 0.75) {
          setTriggered(true);
        }
      } else {
        if (actorRef.current.position.z >= 1.3) {
          setTriggered(true);
        }
      }
    } else if (activeScenario === 'pet' && !triggered) {
      if (actorRef.current && actorRef.current.position.z > 0.5 && actorRef.current.position.z < 1.5) {
        setTriggered(true);
      }
    }

    // Door open/close animation for 'return'
    if (triggered && activeScenario === 'return' && doorRef.current) {
      const actorZ = actorRef.current?.position?.z || -5;
      if (actorZ < 2.5) {
        doorRef.current.rotation.y = Math.min(doorRef.current.rotation.y + delta * 2, Math.PI / 2);
      } else {
        doorRef.current.rotation.y = Math.max(doorRef.current.rotation.y - delta * 2, 0);
      }
    }

    // Gate animation
    if (gateLeftRef.current && gateRightRef.current) {
      const actorZ = actorRef.current?.position?.z || -5;
      const shouldOpenGate = (activeScenario === 'return' || activeScenario === 'delivery') && actorZ > -3.5 && actorZ < 2.0;
      const targetLeft = shouldOpenGate ? -Math.PI / 2 : 0;
      const targetRight = shouldOpenGate ? Math.PI / 2 : 0;
      gateLeftRef.current.rotation.y += (targetLeft - gateLeftRef.current.rotation.y) * delta * 5;
      gateRightRef.current.rotation.y += (targetRight - gateRightRef.current.rotation.y) * delta * 5;
    }

    // Alarm Strobe
    if (lightRef.current) {
      if (triggered && activeScenario === 'intrusion') {
        const t = state.clock.elapsedTime;
        lightRef.current.intensity = (Math.sin(t * 30) > 0) ? 5 : 0; 
        lightRef.current.color.set(Math.sin(t * 15) > 0 ? "#ef4444" : "#1e40af");
      } else {
        const isDaytime = activeScenario === 'delivery' || activeScenario === 'return';
        lightRef.current.intensity = triggered ? 2 : (isDaytime ? 0 : 0.5);
        const targetColor = triggered ? (
          activeScenario === 'delivery' ? "#f59e0b" : 
          activeScenario === 'return' ? "#3b82f6" : "#fcd34d"
        ) : "#ffffff";
        lightRef.current.color.set(targetColor);
      }
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

  const isDaytime = activeScenario === 'delivery' || activeScenario === 'return';
  const isMorning = activeScenario === 'return';

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
        {[-5, -4, -3, -2, -1, 1, 2, 3, 4, 5].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.2, 1.2, 0.1]} />
            <meshStandardMaterial color="#451a03" />
          </mesh>
        ))}
        {/* Left rail */}
        <mesh position={[-3.0, 0.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.2, 0.1, 0.1]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
        <mesh position={[-3.0, -0.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.2, 0.1, 0.1]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
        {/* Right rail */}
        <mesh position={[3.0, 0.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.2, 0.1, 0.1]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
        <mesh position={[3.0, -0.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.2, 0.1, 0.1]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
      </group>

      {/* Animated Gates */}
      <group position={[-0.9, 0.5, -1.5]} ref={gateLeftRef}>
        <mesh position={[0.45, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.9, 0.8, 0.05]} />
          <meshStandardMaterial color="#451a03" />
        </mesh>
      </group>
      <group position={[0.9, 0.5, -1.5]} ref={gateRightRef}>
        <mesh position={[-0.45, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.9, 0.8, 0.05]} />
          <meshStandardMaterial color="#451a03" />
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
      <ambientLight intensity={isDaytime ? 1.0 : 0.2} color={isMorning ? "#FFDAB9" : "#ffffff"} />
      <directionalLight position={[5, 10, -5]} intensity={isDaytime ? 2.5 : 1.5} castShadow={!isDaytime} color={isMorning ? "#FFDAB9" : "#ffffff"} />
      {isDaytime && <directionalLight position={[-5, 10, 5]} intensity={1.5} castShadow color={isMorning ? "#FFDAB9" : "#ffffff"} />}
      <pointLight 
        ref={lightRef}
        position={[0, 2, 1.5]} 
      />
    </group>
  );
}

export default function HouseScene() {
  const activeScenario = useSystemStore(state => state.activeScenario);
  const isDaytime = activeScenario === 'delivery' || activeScenario === 'return';
  const isMorning = activeScenario === 'return';
  const bgColor = isMorning ? '#FFDAB9' : isDaytime ? '#87CEEB' : '#0B0F14';

  return (
    <Canvas shadows camera={{ position: [6, 4, -7], fov: 45 }}>
      <color attach="background" args={[bgColor]} />
      <fog attach="fog" args={[bgColor, 5, isDaytime ? 25 : 15]} />
      <ScenarioSimulation />
      <OrbitControls maxPolarAngle={Math.PI / 2 - 0.1} />
    </Canvas>
  );
}
