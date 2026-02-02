import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  loadBodySettings,
  saveBodySettings,
  type BodySettings,
} from "../bodySettings";

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.25rem",
  fontSize: "0.9rem",
};

const inputStyle: React.CSSProperties = {
  padding: "0.5rem",
  fontSize: "1rem",
  borderRadius: "6px",
  border: "1px solid #555",
  background: "#2a2a3e",
  color: "#fff",
  width: "8rem",
  textAlign: "center",
};

export default function Menu() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<BodySettings>(loadBodySettings);

  function update(field: keyof BodySettings, value: string) {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    const next = { ...settings, [field]: num };
    setSettings(next);
    saveBodySettings(next);
  }

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

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          alignItems: "center",
        }}
      >
        <label style={labelStyle}>
          Arm length (m)
          <input
            type="number"
            step="0.01"
            style={inputStyle}
            value={settings.armLength}
            onChange={(e) => update("armLength", e.target.value)}
          />
        </label>

        <label style={labelStyle}>
          Horizontal distance eyes → shoulders (m)
          <input
            type="number"
            step="0.01"
            style={inputStyle}
            value={settings.shoulderHorizontal}
            onChange={(e) => update("shoulderHorizontal", e.target.value)}
          />
        </label>

        <label style={labelStyle}>
          Vertical distance eyes → shoulders (m)
          <input
            type="number"
            step="0.01"
            style={inputStyle}
            value={settings.shoulderVertical}
            onChange={(e) => update("shoulderVertical", e.target.value)}
          />
        </label>
      </div>

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
