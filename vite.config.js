import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

// ESM projelerde __dirname alternatifi
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Bu repo bir "project page" olarak yayındaysa
// nihai URL: https://yigitemreturkkan.github.io/dijitalkatip.github.io/
// Vite'in asset yollarını doğru üretmesi için base ayarı:
export default defineConfig({
  plugins: [react()],
  base: "/dijitalkatip.github.io/",
  resolve: {
    alias: {
      // "pdfmake/build/pdfmake" görüldüğünde node_modules içindeki gerçek dosyaya git
      "pdfmake/build/pdfmake": path.resolve(__dirname, "node_modules/pdfmake/build/pdfmake.js"),
      "pdfmake/build/vfs_fonts": path.resolve(__dirname, "node_modules/pdfmake/build/vfs_fonts.js")
    }
  },
  build: {
    rollupOptions: {
      // pdfmake'in içindeki bazı dinamik yapıların hata vermemesi için
      external: []
    },
    commonjsOptions: {
      include: [/pdfmake/, /node_modules/],
      transformMixedEsModules: true
    }
  }
});


