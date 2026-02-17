import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1]
const isUserSite = repositoryName?.toLowerCase().endsWith(".github.io")

const githubPagesBase =
  process.env.GITHUB_ACTIONS === "true" && repositoryName && !isUserSite
    ? `/${repositoryName}/`
    : "/"

export default defineConfig({
  base: githubPagesBase,
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
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
