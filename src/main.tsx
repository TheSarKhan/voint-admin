import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
// Poppins — self-hosted (CDN yoxdur). latin + latin-ext hər ikisi lazımdır:
// Azərbaycan əlifbasının ə/Ə/ş/Ş/ğ/Ğ/İ hərfləri latin-ext altsetindədir.
import "@fontsource/poppins/latin-400.css";
import "@fontsource/poppins/latin-ext-400.css";
import "@fontsource/poppins/latin-500.css";
import "@fontsource/poppins/latin-ext-500.css";
import "@fontsource/poppins/latin-600.css";
import "@fontsource/poppins/latin-ext-600.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
