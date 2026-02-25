import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("components", "routes/components.tsx"),
  route("manufacturers", "routes/manufacturers.tsx"),
  route("builds", "routes/builds.tsx"),
  route("builds/:id", "routes/build-detail.tsx"),
  route("builds/:id/ballistics", "routes/build-ballistics.tsx"),
  route("builds/:id/ballistics/:profileId", "routes/dope-card.tsx"),
  route("marketplace", "routes/marketplace.tsx"),
  route("marketplace/:id", "routes/marketplace-listing.tsx"),
  route("messages", "routes/messages.tsx"),
  route("messages/:id", "routes/messages-conversation.tsx"),
  route("account", "routes/account/index.tsx"),
  route("account/profile", "routes/account/profile.tsx"),
  route("account/security", "routes/account/security.tsx"),
  route("account/preferences", "routes/account/preferences.tsx"),
] satisfies RouteConfig;
