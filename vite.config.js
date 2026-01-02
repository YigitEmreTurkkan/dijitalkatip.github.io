import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Bu repo bir "project page" olarak yayındaysa
// nihai URL: https://yigitemreturkkan.github.io/dijitalkatip.github.io/
// Vite'in asset yollarını doğru üretmesi için base ayarı:
export default defineConfig({
  plugins: [react()],
  base: "/dijitalkatip.github.io/",
  // Alias kısmını tamamen kaldırıyoruz - Vite'in kendi çözme mekanizmasına güveniyoruz
  resolve: {
    alias: {}
  },
  optimizeDeps: {
    // pdfmake'i önceden optimize etmesini zorla
    include: ["pdfmake/build/pdfmake", "pdfmake/build/vfs_fonts"]
  },
  build: {
    commonjsOptions: {
      include: [/pdfmake/, /node_modules/],
      transformMixedEsModules: true
    }
  }
});


