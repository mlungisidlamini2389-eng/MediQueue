import { defineConfig } from "@playwright/test";
import path from "node:path";

const e2eDatabase = path.resolve(`mediqueue-e2e-${process.pid}.db`);

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  timeout: 120000,
  expect: { timeout: 15000 },
  use: {
    baseURL: "http://127.0.0.1:5173",
    browserName: "chromium",
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command:
        ".venv\\Scripts\\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000",
      cwd: path.resolve("..", "backend"),
      url: "http://127.0.0.1:8000/health",
      reuseExistingServer: false,
      timeout: 180000,
      env: {
        ...process.env,
        MEDIQUEUE_DB_PATH: e2eDatabase,
        MEDIQUEUE_ADMIN_EMAIL: "e2e-admin@example.com",
        MEDIQUEUE_ADMIN_PASSWORD: "e2e-admin-password",
        MEDIQUEUE_ADMIN_NAME: "E2E Admin",
      },
    },
    {
      command: "npm run build && npm run preview -- --port 5173 --strictPort",
      url: "http://127.0.0.1:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 180000,
    },
  ],
});
