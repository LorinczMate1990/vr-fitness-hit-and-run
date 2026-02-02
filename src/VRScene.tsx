import { createRef, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  XR,
  createXRStore,
  XROrigin,
  XRSpace,
  useXRInputSourceState,
} from "@react-three/xr";
import { OrbitControls } from "@react-three/drei";
import { Box3, type Mesh } from "three";

const xrStore = createXRStore({
  handTracking: true,
  bounded: true,
  foveation: 1,
  frameRate: "high",
  controller: { model: false, rayPointer: false },
});

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl2") || canvas.getContext("webgl")
    );
  } catch {
    return false;
  }
}

const movingBoxRef = createRef<Mesh>();

function MovingBox() {
  useFrame(({ clock }) => {
    if (movingBoxRef.current) {
      const t = clock.getElapsedTime();
      movingBoxRef.current.position.z = -3 + Math.sin(t) * 2;
    }
  });

  return (
    <mesh ref={movingBoxRef} position={[-1.2, 1, -3]}>
      <boxGeometry args={[0.6, 0.6, 0.6]} />
      <meshStandardMaterial color="#4361ee" />
    </mesh>
  );
}

function useControllerCollision(
  controllerMeshRef: React.RefObject<Mesh | null>,
  inputSource: XRInputSource | undefined
) {
  const lastPulse = useRef(0);
  const boxA = useRef(new Box3());
  const boxB = useRef(new Box3());

  useFrame(() => {
    if (!controllerMeshRef.current || !movingBoxRef.current || !inputSource)
      return;

    boxA.current.setFromObject(controllerMeshRef.current);
    boxB.current.setFromObject(movingBoxRef.current);

    if (boxA.current.intersectsBox(boxB.current)) {
      const now = performance.now();
      if (now - lastPulse.current > 200) {
        lastPulse.current = now;
        const gamepad = inputSource.gamepad;
        if (gamepad?.hapticActuators?.[0]) {
          (gamepad.hapticActuators[0] as any).pulse(0.8, 100);
        }
      }
    }
  });
}

function LeftControllerObject() {
  const controller = useXRInputSourceState("controller", "left");
  const meshRef = useRef<Mesh>(null);
  useControllerCollision(meshRef, controller?.inputSource);
  if (!controller) return null;
  return (
    <XRSpace space={controller.inputSource.gripSpace!}>
      <mesh ref={meshRef}>
        <boxGeometry args={[0.1, 0.1, 0.15]} />
        <meshStandardMaterial color="#2ecc71" />
      </mesh>
    </XRSpace>
  );
}

function RightControllerObject() {
  const controller = useXRInputSourceState("controller", "right");
  const meshRef = useRef<Mesh>(null);
  useControllerCollision(meshRef, controller?.inputSource);
  if (!controller) return null;
  return (
    <XRSpace space={controller.inputSource.gripSpace!}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.08, 32, 32]} />
        <meshStandardMaterial color="#2ecc71" />
      </mesh>
    </XRSpace>
  );
}

function TestObjects() {
  return (
    <group>
      <MovingBox />

      <mesh position={[1.2, 1, -3]}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color="#f72585" />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#2a2a3e" />
      </mesh>
    </group>
  );
}

export default function VRScene() {
  if (!hasWebGL()) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: "1rem",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <h2>WebGL Not Available</h2>
        <p>
          Your browser or device does not support WebGL, which is required for
          the 3D scene. Try enabling hardware acceleration in your browser
          settings, or use a device with GPU support.
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <div
        style={{
          position: "absolute",
          top: "1rem",
          right: "1rem",
          zIndex: 10,
          display: "flex",
          gap: "0.5rem",
        }}
      >
        <button
          onClick={() => xrStore.enterVR()}
          style={{
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            borderRadius: "8px",
            border: "none",
            background: "#4361ee",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Enter VR
        </button>
      </div>

      <Canvas>
        <XR store={xrStore}>
          <XROrigin />

          <LeftControllerObject />
          <RightControllerObject />

          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />

          <TestObjects />

          <OrbitControls />
        </XR>
      </Canvas>
    </div>
  );
}
