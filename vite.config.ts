import tailwindcss from "@tailwindcss/vite"
import { reactRouter } from "@react-router/dev/vite"
import path from "path"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./app"),
    },
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/@js-temporal/polyfill/")) {
            return "temporal-polyfill"
          }

          if (id.includes("/@tanstack/react-query/")) {
            return "react-query"
          }

          if (id.includes("/@supabase/supabase-js/")) {
            return "supabase"
          }

          if (
            id.includes("/react-hook-form/") ||
            id.includes("/@hookform/resolvers/") ||
            id.includes("/zod/")
          ) {
            return "forms"
          }
        },
      },
    },
  },
})
