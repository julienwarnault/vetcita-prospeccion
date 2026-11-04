import { createRoot } from "react-dom/client";
import Session from "./Session";
import "maplibre-gl/dist/maplibre-gl.css";
import "./styles.css";

createRoot(document.getElementById("root")!).render(<Session />);
