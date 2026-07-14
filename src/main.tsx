
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";
  import { patchDomForTranslate } from "./lib/patchDomForTranslate";

  patchDomForTranslate();

  createRoot(document.getElementById("root")!).render(<App />);
