import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { GlobalAudioProvider } from "./contexts/GlobalAudioContext";

createRoot(document.getElementById("root")!).render(
  <GlobalAudioProvider>
    <App />
  </GlobalAudioProvider>
);
