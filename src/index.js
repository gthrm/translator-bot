const TelegramBot = require('node-telegram-bot-api');
const config = require('./utils/config');
const logger = require('./utils/logger');
const bot = require('./bot');
const { connectClickHouse } = require('./db');
const { runMigrations } = require('./clickhouse/migrations');

const telegramBot = new TelegramBot(config.TELEGRAM_BOT_TOKEN, { polling: true });

connectClickHouse()
  .then(() => {
    logger.info('Connected to ClickHouse');
    return runMigrations()
      .then(() => {
        logger.info('Migrations completed');
        return bot.initialize(telegramBot).then(() => logger.info('Bot initialized'));
      })
      .catch((error) => {
        logger.error('Error running migrations:', error);
        process.exit(1);
      });
  })
  .catch((error) => {
    logger.error('Main Error connecting to ClickHouse:', error);
    process.exit(1);
  });
