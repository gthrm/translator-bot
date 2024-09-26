/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
const path = require('path');
const fs = require('fs/promises');
const { getClickHouseClient } = require('../../db');
const logger = require('../../utils/logger');

async function runMigrations() {
  const client = getClickHouseClient();

  logger.info('Running migrations...');

  await client.exec({
    query: `
      CREATE TABLE IF NOT EXISTS migrations (
        id UInt32,
        name String,
        executed_at DateTime DEFAULT now()
      ) ENGINE = MergeTree()
      ORDER BY id
      PRIMARY KEY id
      SETTINGS index_granularity = 8192;
    `,
  });

  logger.info('Migrations table created');

  const data = await client.query({
    query: 'SELECT name FROM migrations',
    format: 'JSONEachRow',
  });

  const executedMigrations = await data.json();

  const executedMigrationNames = new Set(executedMigrations.map((m) => m.name));

  const migrationsDir = path.join(__dirname, 'scripts');
  const migrationFiles = await fs.readdir(migrationsDir);

  for (const file of migrationFiles) {
    if (file.endsWith('.sql') && !executedMigrationNames.has(file)) {
      const filePath = path.join(migrationsDir, file);
      const migrationSql = await fs.readFile(filePath, 'utf-8');

      logger.info(`Running migration: ${file}`);
      await client.exec({ query: migrationSql });

      await client.insert({
        table: 'migrations',
        values: [{ id: executedMigrations.length + 1, name: file }],
        format: 'JSONEachRow',
      });

      logger.info(`Migration completed: ${file}`);
    }
  }
}

module.exports = { runMigrations };
