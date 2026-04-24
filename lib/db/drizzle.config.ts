import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import path from "path";

if (!process.env.CLOUDFLARE_ACCOUNT_ID) {
  throw new Error("CLOUDFLARE_ACCOUNT_ID is required for D1 push.");
}

if (!process.env.CLOUDFLARE_DATABASE_ID) {
  throw new Error("CLOUDFLARE_DATABASE_ID is required for D1 push.");
}

if (!process.env.CLOUDFLARE_D1_TOKEN) {
  throw new Error("CLOUDFLARE_D1_TOKEN is required for D1 push.");
}

export default defineConfig({
  out: path.join(__dirname, "./drizzle"),
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    databaseId: process.env.CLOUDFLARE_DATABASE_ID,
    token: process.env.CLOUDFLARE_D1_TOKEN,
  },
});