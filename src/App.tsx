import { BrowserRouter, Routes, Route } from "react-router-dom";
import Menu from "./Menu";
import VRScene from "./VRScene";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/vr" element={<VRScene />} />
      </Routes>
    </BrowserRouter>
  );
}
