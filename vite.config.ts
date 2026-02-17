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
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
  },
})
