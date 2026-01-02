import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Bu repo bir "project page" olarak yayındaysa
// nihai URL: https://yigitemreturkkan.github.io/dijitalkatip.github.io/
// Vite'in asset yollarını doğru üretmesi için base ayarı:
export default defineConfig({
  plugins: [react()],
  base: "/dijitalkatip.github.io/",
  resolve: {
    alias: {
      "pdfmake/build/pdfmake": "pdfmake/build/pdfmake.js",
      "pdfmake/build/vfs_fonts": "pdfmake/build/vfs_fonts.js"
    }
  },
  optimizeDeps: {
    include: ["pdfmake", "pdfmake/build/pdfmake.js", "pdfmake/build/vfs_fonts.js"]
  }
});


