import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath } from "node:url";

// `base: "./"` + HashRouter lets the build run from any static host or sub-path
// (GitHub Pages, Cloudflare Pages, a USB stick) without configuration.
export default defineConfig({
  base: "./",
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "SoundSteps — Phonics Playground",
        short_name: "SoundSteps",
        description: "Hear it. Say it. Blend it. Read it! Free phonics for children.",
        theme_color: "#ff8a5c",
        background_color: "#fff8ef",
        display: "standalone",
        start_url: ".",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon.svg", sizes: "any", type: "image/svg+xml" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        // only the Latin font files are needed for English
        globIgnores: ["**/*-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese,hebrew}-*.woff2"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes("/audio/"),
            handler: "CacheFirst",
            options: { cacheName: "soundsteps-audio", expiration: { maxEntries: 3000 } },
          },
        ],
      },
    }),
  ],
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
