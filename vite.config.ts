// import build from "@hono/vite-build/cloudflare-pages";
import build from "@hono/vite-build/cloudflare-workers";
// import build from "@hono/vite-build/bun";
import adapter from "@hono/vite-dev-server/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import honox from "honox/vite";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  if (mode === "client") {
    return {
      build: {
        manifest: true,
        rollupOptions: {
          input: ["./app/style.css"],
        },
      },
      plugins: [tailwindcss()],
    };
  }
  return {
    ssr: {
      external: ["iconv-lite", "encoding-japanese"],
    },
    server: {
      port: 80,
      // 一般公開
      host: true,
    },
    plugins: [
      honox({
        client: {
          input: ["/app/style.css"],
        },
        devServer: { adapter },
      }),
      build(),
      tailwindcss(),
    ],
  };
});
