import { defineConfig, devices } from '@playwright/test'

const database = process.env.E2E_DB_NAME
if (database !== 'digital_wardrobe_e2e') {
  throw new Error(
    'E2E_DB_NAME must be digital_wardrobe_e2e to protect application databases',
  )
}
for (const key of ['E2E_DB_HOST', 'E2E_DB_USER', 'E2E_DB_PASSWORD']) {
  if (!process.env[key])
    throw new Error(`${key} is required to run browser E2E tests`)
}

const apiPort = Number(process.env.E2E_API_PORT ?? 3101)
const frontendPort = Number(process.env.E2E_FRONTEND_PORT ?? 5174)
const apiUrl = `http://127.0.0.1:${apiPort}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://127.0.0.1:${frontendPort}`,
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: [
    {
      command: 'npm --prefix backend run start:dev',
      cwd: '..',
      url: `${apiUrl}/health`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        PORT: String(apiPort),
        DB_HOST: process.env.E2E_DB_HOST!,
        DB_PORT: process.env.E2E_DB_PORT ?? '3306',
        DB_USER: process.env.E2E_DB_USER!,
        DB_PASSWORD: process.env.E2E_DB_PASSWORD!,
        DB_NAME: database,
        JWT_SECRET:
          process.env.E2E_JWT_SECRET ??
          'local-e2e-only-secret-at-least-32-characters',
        NODE_ENV: 'test',
        FRONTEND_URL: `http://127.0.0.1:${frontendPort}`,
        API_PROXY_TARGET: apiUrl,
      },
    },
    {
      command: `npm --prefix frontend run dev -- --host 127.0.0.1 --port ${frontendPort} --strictPort`,
      cwd: '..',
      url: `http://127.0.0.1:${frontendPort}/`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: { API_PROXY_TARGET: apiUrl },
    },
  ],
})
