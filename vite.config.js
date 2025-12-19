import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages için gerekirse "base" alanını repo adına göre düzenleyebilirsin.
export default defineConfig({
  plugins: [react()],
  // base: "/dijitalkatip.github.io/",
});


