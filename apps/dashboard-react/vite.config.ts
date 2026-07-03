import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

const pkgDir = path.resolve(__dirname, "./src/pkg");

export default defineConfig({
  define: {
    "process.env": JSON.stringify({}),
  },
  plugins: [react()],
  optimizeDeps: {
    exclude: ["nuqs"],
  },
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      { find: "@api", replacement: path.resolve(__dirname, "../api/src") },
      { find: /^next\/navigation(\.js)?$/, replacement: path.resolve(__dirname, "./src/next/navigation.tsx") },
      { find: /^next\/link(\.js)?$/, replacement: path.resolve(__dirname, "./src/next/link.tsx") },
      { find: /^next\/image(\.js)?$/, replacement: path.resolve(__dirname, "./src/next/image.tsx") },
      { find: /^next\/headers(\.js)?$/, replacement: path.resolve(__dirname, "./src/next/headers.ts") },
      { find: /^next\/cache(\.js)?$/, replacement: path.resolve(__dirname, "./src/next/cache.ts") },
      { find: /^next\/dynamic(\.js)?$/, replacement: path.resolve(__dirname, "./src/next/dynamic.ts") },
      { find: /^next\/compat\/router(\.js)?$/, replacement: path.resolve(__dirname, "./src/next/navigation.tsx") },
      { find: "nuqs/adapters/react-router/v6", replacement: path.resolve(__dirname, "../../node_modules/nuqs/dist/adapters/react-router/v6.js") },
      { find: /^nuqs\/server$/, replacement: path.resolve(__dirname, "../../node_modules/nuqs/dist/server.js") },
      { find: /^invoice$/, replacement: path.join(pkgDir, "invoice/index.tsx") },
      { find: /^invoice\/recurring$/, replacement: path.join(pkgDir, "invoice/utils/recurring.ts") },
      { find: /^invoice\/calculate$/, replacement: path.join(pkgDir, "invoice/utils/calculate.ts") },
      { find: /^invoice\/currency$/, replacement: path.join(pkgDir, "invoice/utils/currency.ts") },
      { find: /^invoice\/utils$/, replacement: path.join(pkgDir, "invoice/utils/transform.ts") },
      { find: /^invoice\/types$/, replacement: path.join(pkgDir, "invoice/types.ts") },
      { find: /^invoice\/content$/, replacement: path.join(pkgDir, "invoice/utils/content.ts") },
      { find: /^invoice\/format-to-html$/, replacement: path.join(pkgDir, "invoice/templates/html/format.tsx") },
      { find: /^invoice\/templates\/(.+)$/, replacement: path.join(pkgDir, "invoice/templates/$1/index.tsx") },
      { find: /^invoice\/(.+)$/, replacement: path.join(pkgDir, "invoice/$1") },
      { find: /^location$/, replacement: path.join(pkgDir, "location/index.ts") },
      { find: /^location\/(.+)$/, replacement: path.join(pkgDir, "location/$1") },
      { find: /^jobs\/(.+)$/, replacement: path.join(pkgDir, "jobs-$1") },
      { find: /^plans$/, replacement: path.join(pkgDir, "plans.ts") },
      { find: /^import$/, replacement: path.join(pkgDir, "import.ts") },
      { find: /^email\/defaults$/, replacement: path.join(pkgDir, "email-defaults.ts") },
      { find: /^notifications$/, replacement: path.join(pkgDir, "notifications.ts") },
    ],
  },
  server: {
    port: 3001,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3003",
        changeOrigin: true,
      },
      "/trpc": {
        target: "http://127.0.0.1:3003",
        changeOrigin: true,
      },
      "/auth": {
        target: "http://127.0.0.1:3003",
        changeOrigin: true,
      },
      "/files": {
        target: "http://127.0.0.1:3003",
        changeOrigin: true,
      },
    },
  },
});
