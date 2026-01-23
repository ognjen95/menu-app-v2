import { defineConfig } from "drizzle-kit";
import { config } from 'dotenv';

process.env.NODE_ENV !== 'production' ? config({ path: '.env' }) : config({ path: '.env.local' })// or .env.local
config({ path: '.env.local' })
export default defineConfig({
    schema: "./lib/schema.ts",
    out: "./lib/migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});