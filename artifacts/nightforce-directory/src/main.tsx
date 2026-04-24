import { Buffer } from "buffer/";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

if (typeof globalThis !== "undefined" && !(globalThis as any).Buffer) {
  (globalThis as any).Buffer = Buffer;
}

createRoot(document.getElementById("root")!).render(<App />);