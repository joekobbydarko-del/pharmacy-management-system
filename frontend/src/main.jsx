import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import App from "./App.jsx";

const savedTheme = localStorage.getItem("theme");

const systemPrefersDark =
  window.matchMedia &&
  window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

const initialTheme =
  savedTheme ||
  (systemPrefersDark ? "dark" : "light");

document.documentElement.setAttribute(
  "data-theme",
  initialTheme
);

createRoot(
  document.getElementById("root")
).render(
  <StrictMode>
    <App />
  </StrictMode>
);