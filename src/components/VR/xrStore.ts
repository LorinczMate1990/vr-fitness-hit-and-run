import { createXRStore } from "@react-three/xr";

export const xrStore = createXRStore({
  handTracking: true,
  bounded: true,
  foveation: 1,
  frameRate: "high",
  controller: { model: false, rayPointer: false },
  sessionInit: {
    requiredFeatures: ["local-floor"],
    optionalFeatures: ["camera-access"],
  },
});
