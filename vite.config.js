import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Bu repo bir "project page" olarak yayındaysa
// nihai URL: https://yigitemreturkkan.github.io/dijitalkatip.github.io/
// Vite'in asset yollarını doğru üretmesi için base ayarı:
export default defineConfig({
  plugins: [react()],
  base: "/dijitalkatip.github.io/",
  resolve: {
    // Browser field'ını kullan ve extensions ekle
    conditions: ["browser", "module", "import", "default"],
    extensions: [".js", ".jsx", ".ts", ".tsx", ".json"]
  },
  optimizeDeps: {
    // Dinamik import kullanıldığı için optimizeDeps'e eklemeye gerek yok
    // Vite runtime'da otomatik olarak optimize edecek
  },
  build: {
    rollupOptions: {
      // pdfmake'i external olarak işaretleme - bundle'a dahil et
      external: []
    },
    commonjsOptions: {
      include: [/pdfmake/, /node_modules/],
      transformMixedEsModules: true
    }
  }
});


