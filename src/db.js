const { createClient } = require('@clickhouse/client');
const logger = require('./utils/logger');
const config = require('./utils/config');

let client;

const connectClickHouse = async () => {
  try {
    logger.info('Connecting to ClickHouse...');

    client = createClient({
      url: config.CLICKHOUSE_URL,
    });

    await client.ping();
    logger.info('Connected to ClickHouse');
  } catch (error) {
    logger.error('Internal Error connecting to ClickHouse:', error);
    process.exit(1);
  }
};

const getClickHouseClient = () => {
  if (!client) {
    throw new Error('ClickHouse client not initialized. Call connectClickHouse first.');
  }
  return client;
};

module.exports = { connectClickHouse, getClickHouseClient };
