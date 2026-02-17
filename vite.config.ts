import { defineConfig } from "vite"
import tailwindcss from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import viteTsConfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart({
      spa: {
        enabled: true,
        prerender: {
          outputPath: "/_shell",
        },
      },
    }),
    viteReact({
      babel: {
        plugins: ["babel-plugin-react-compiler"],
      },
    }),
  ],
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
