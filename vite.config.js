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
      // pdfmake'i external olarak işaretle - build aşamasında çözmeye çalışma
      external: (id) => {
        // pdfmake ile ilgili tüm import'ları external olarak işaretle
        if (id.includes('pdfmake/build/pdfmake') || id.includes('pdfmake/build/vfs_fonts')) {
          return true;
        }
        return false;
      },
      output: {
        // External modüller için globals tanımla (runtime'da yüklenecek)
        globals: {}
      }
    },
    commonjsOptions: {
      include: [/pdfmake/, /node_modules/],
      transformMixedEsModules: true
    }
  }
});


