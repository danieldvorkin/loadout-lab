import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  server: {
    port: 5173,
    proxy: {
      // Proxy API requests to Rails backend
      "/graphql": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      // Proxy health check and other API routes
      "/up": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
