const database = process.env.E2E_DB_NAME;
if (database !== 'digital_wardrobe_e2e') {
  throw new Error('E2E_DB_NAME must be digital_wardrobe_e2e to protect application databases');
}

const required = ['E2E_DB_HOST', 'E2E_DB_USER', 'E2E_DB_PASSWORD'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`${key} is required`);
}

process.env.DB_HOST = process.env.E2E_DB_HOST;
process.env.DB_PORT = process.env.E2E_DB_PORT ?? '3306';
process.env.DB_USER = process.env.E2E_DB_USER;
process.env.DB_PASSWORD = process.env.E2E_DB_PASSWORD;
process.env.DB_NAME = database;
process.env.JWT_SECRET =
  process.env.E2E_JWT_SECRET ?? 'local-e2e-only-secret-at-least-32-characters';
