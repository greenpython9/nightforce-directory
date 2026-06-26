import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

function patchMidnightWalletAddressFormat() {
  return {
    name: "nightforce-patch-midnight-wallet-address-format",
    enforce: "pre" as const,
    transform(code: string, id: string) {
      if (
        !id.includes("@midnight-ntwrk/wallet-sdk-address-format") ||
        !id.includes("/dist/index.js")
      ) {
        return null;
      }

      const patched = code
        .replace(
          "static [Bech32mSymbol] = ShieldedAddress.codec;",
          "static { this[Bech32mSymbol] = this.codec; }",
        )
        .replace(
          "static [Bech32mSymbol] = UnshieldedAddress.codec;",
          "static { this[Bech32mSymbol] = this.codec; }",
        )
        .replace(
          "static [Bech32mSymbol] = DustAddress.codec;",
          "static { this[Bech32mSymbol] = this.codec; }",
        );

      if (patched === code) {
        return null;
      }

      return {
        code: patched,
        map: null,
      };
    },
  };
}

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, path.resolve(import.meta.dirname), "");
  const rawPort = (process.env.PORT ?? env.PORT ?? "5173").trim();
  const port = Number(rawPort);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }

  const basePath = (process.env.BASE_PATH ?? env.BASE_PATH ?? "/").trim();

  if (!basePath) {
    throw new Error("BASE_PATH must not be empty.");
  }

  return {
    base: basePath,
    plugins: [
      patchMidnightWalletAddressFormat(),
      wasm(),
      topLevelAwait(),
      react(),
      tailwindcss(),
      runtimeErrorOverlay(),
      ...(process.env.NODE_ENV !== "production" &&
      process.env.REPL_ID !== undefined
        ? [
            await import("@replit/vite-plugin-cartographer").then((m) =>
              m.cartographer({
                root: path.resolve(import.meta.dirname, ".."),
              }),
            ),
            await import("@replit/vite-plugin-dev-banner").then((m) =>
              m.devBanner(),
            ),
          ]
        : []),
    ],
    esbuild: {
      target: "es2022",
      keepNames: true,
    },
    optimizeDeps: {
      esbuildOptions: {
        target: "es2022",
        keepNames: true,
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
        "@assets": path.resolve(
          import.meta.dirname,
          "..",
          "..",
          "attached_assets",
        ),
      },
      dedupe: [
        "react",
        "react-dom",
        "@midnight-ntwrk/compact-runtime",
        "@midnight-ntwrk/onchain-runtime-v3",
        "@midnight-ntwrk/wallet-sdk-address-format",
        "@midnight-ntwrk/dapp-connector-api",
      ],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      target: "es2022",
      minify: "esbuild",
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      port,
      host: "0.0.0.0",
      allowedHosts: true,
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
    preview: {
      port,
      host: "0.0.0.0",
      allowedHosts: true,
    },
  };
});
