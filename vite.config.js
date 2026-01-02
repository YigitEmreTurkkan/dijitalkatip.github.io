import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Bu repo bir "project page" olarak yayındaysa
// nihai URL: https://yigitemreturkkan.github.io/dijitalkatip.github.io/
// Vite'in asset yollarını doğru üretmesi için base ayarı:
export default defineConfig({
  plugins: [react()],
  base: "/dijitalkatip.github.io/",
  resolve: {
    alias: {
      // pdfmake'in node_modules içindeki tam yolunu gösteriyoruz (case-sensitive uyumlu)
      "pdfmake/build/pdfmake": resolve(__dirname, "node_modules/pdfmake/build/pdfmake.js"),
      "pdfmake/build/vfs_fonts": resolve(__dirname, "node_modules/pdfmake/build/vfs_fonts.js")
    }
  },
  optimizeDeps: {
    include: ["pdfmake/build/pdfmake.js", "pdfmake/build/vfs_fonts.js"]
  },
  build: {
    commonjsOptions: {
      include: [/pdfmake/, /node_modules/],
      transformMixedEsModules: true
    }
  }
});


