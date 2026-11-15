import { fileURLToPath } from "node:url";
import { loadEnvFile } from "node:process";
import { defineConfig } from "vitest/config";

try {
  loadEnvFile(fileURLToPath(new URL("./.env.local", import.meta.url)));
} catch {
  // Sin .env.local las pruebas de base de datos se omiten.
}

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["src/**/*.test.ts", "tests/**/*.test.ts"], testTimeout: 20000 },
});
