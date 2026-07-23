import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // voint-panel default olaraq 5173-de isleyir - eyni vaxtda yanasi
    // calisda bilmek ucun voint-admin ferqli port istifade edir.
    port: 5180,
  },
});
