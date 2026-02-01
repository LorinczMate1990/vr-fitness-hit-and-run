import { useNavigate } from "react-router-dom";

export default function Menu() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: "2rem",
      }}
    >
      <h1>VR Training</h1>
      <button
        onClick={() => navigate("/vr")}
        style={{
          padding: "1rem 3rem",
          fontSize: "1.25rem",
          borderRadius: "8px",
          border: "none",
          background: "#4361ee",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        Start
      </button>
    </div>
  );
}
