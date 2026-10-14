const { readFile } = require('node:fs/promises');
const path = require('node:path');
const mysql = require('mysql2/promise');

async function main() {
  const database = process.env.E2E_DB_NAME;
  if (database !== 'digital_wardrobe_e2e') {
    throw new Error('E2E_DB_NAME must be digital_wardrobe_e2e to protect application databases');
  }
  for (const key of ['E2E_DB_HOST', 'E2E_DB_USER', 'E2E_DB_PASSWORD']) {
    if (!process.env[key]) throw new Error(`${key} is required`);
  }

  const connection = await mysql.createConnection({
    host: process.env.E2E_DB_HOST,
    port: Number(process.env.E2E_DB_PORT ?? 3306),
    user: process.env.E2E_DB_USER,
    password: process.env.E2E_DB_PASSWORD,
    database,
    multipleStatements: true,
  });
  try {
    const schemaFile = await readFile(
      path.resolve(__dirname, '../../sql/digital_wardrobe.sql'),
      'utf8',
    );
    const schema = schemaFile.replace(
      /^\s*CREATE DATABASE IF NOT EXISTS digital_wardrobe[\s\S]*?;\s*USE digital_wardrobe;\s*/i,
      '',
    );
    await connection.query(schema);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(`Database test setup failed: ${error.code ?? error.name}`);
  process.exitCode = 1;
});
