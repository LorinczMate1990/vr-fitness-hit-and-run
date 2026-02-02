import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { XROrigin } from "@react-three/xr";
import { OrbitControls } from "@react-three/drei";
import type { Mesh } from "three";
import LeftControllerObject from "./LeftControllerObject";
import RightControllerObject from "./RightControllerObject";
import MovingBox from "./MovingBox";

export default function SceneContent() {
  const [deltaT, setDeltaT] = useState(0);
  const movingBoxRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    setDeltaT(delta);
  });

  return (
    <>
      <XROrigin />

      <LeftControllerObject deltaT={deltaT} targetRef={movingBoxRef} />
      <RightControllerObject deltaT={deltaT} targetRef={movingBoxRef} />

      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />

      <MovingBox deltaT={deltaT} meshRef={movingBoxRef} />

      <mesh position={[1.2, 1, -3]}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color="#f72585" />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#2a2a3e" />
      </mesh>

      <OrbitControls />
    </>
  );
}
