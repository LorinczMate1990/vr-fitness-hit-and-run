import { BrowserRouter, Routes, Route } from "react-router-dom";
import Menu from "./views/Menu";
import VRScene from "./views/VRScene";

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
