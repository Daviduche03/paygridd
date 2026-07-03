import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";
import remarkGfm from "remark-gfm";
import path from "node:path";

export default defineConfig({
  base: "/docs/",
  plugins: [
    { enforce: "pre", ...mdx({ providerImportSource: "@mdx-js/react", remarkPlugins: [remarkGfm] }) },
    react({ include: /\.(mdx|tsx)$/ }),
  ],
  resolve: {
    alias: {
      "@docs": path.resolve(__dirname, "./src/docs"),
    },
  },
  build: {
    outDir: "dist",
  },
});
