import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    ...(mode === "development"
      ? {
          proxy: {
            "/api": {
              target: "https://turkyapimi.com",
              changeOrigin: true,
              secure: true,
            },
          },
        }
      : {}),
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));



