import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("components", "routes/components.tsx"),
  route("builds", "routes/builds.tsx"),
  route("builds/:id", "routes/build-detail.tsx"),
] satisfies RouteConfig;
