import { type RouteConfig, index, route } from "@react-router/dev/routes"

export default [
  route("auth/callback", "routes/auth-callback.tsx"),
  route("/", "routes/app-layout.tsx", [
    index("routes/dashboard.tsx"),
    route("workout", "routes/workout.tsx"),
    route("progress", "routes/progress.tsx"),
    route("settings", "routes/settings.tsx"),
  ]),
] satisfies RouteConfig
