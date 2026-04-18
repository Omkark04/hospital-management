import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// Make sure the path matches where the .glb is. Vite imports from src/assets directly.
import spineModelPath from '../../assets/spine 3d model.glb?url';

export default function SpineModel() {
  const { scene } = useGLTF(spineModelPath);
  const groupRef = useRef();

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Just a slow, continuous idle rotation
    groupRef.current.rotation.y += delta * 0.2;
  });

  return (
    <>
      <ambientLight intensity={0.7} color="#f0dfa8" />
      <directionalLight 
        position={[8, 15, 8]} 
        intensity={2.8} 
        color="#ffffff" 
        castShadow 
      />
      <directionalLight 
        position={[-5, 5, -5]} 
        intensity={1.2} 
        color="#c89030" 
      />
      <pointLight position={[2, 0, 4]} intensity={2.0} color="#f0dfa8" distance={10} />
      
      <group position={[3.5, -0.5, 0]} rotation={[0, -Math.PI / 8, 0]}>
        <group ref={groupRef} scale={4}>
          <primitive object={scene} />
        </group>

        {/* Ayurvedic glow below the model */}
        <ContactShadows 
           position={[0, -1.5, 0]} 
           opacity={0.6} 
           scale={8} 
           blur={2.5} 
           far={10} 
           color="#7b5514"
        />
      </group>
      
      {/* Soft environment lighting to give organic reflections */}
      <Environment preset="city" />
    </>
  );
}
