import { Canvas } from "@react-three/fiber";
import { XR } from "@react-three/xr";
import { useNavigate } from "react-router-dom";
import { xrStore } from "../components/VR/xrStore";
import SceneContent from "../components/VR/SceneContent";

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

const btnStyle: React.CSSProperties = {
  padding: "0.75rem 1.5rem",
  fontSize: "1rem",
  borderRadius: "8px",
  border: "none",
  color: "#fff",
  cursor: "pointer",
};

export default function VRScene() {
  const navigate = useNavigate();

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
          onClick={() => navigate("/")}
          style={{ ...btnStyle, background: "#555" }}
        >
          Menu
        </button>
        <button
          onClick={() => xrStore.enterVR()}
          style={{ ...btnStyle, background: "#4361ee" }}
        >
          Enter VR
        </button>
      </div>

      <Canvas>
        <XR store={xrStore}>
          <SceneContent />
        </XR>
      </Canvas>
    </div>
  );
}
