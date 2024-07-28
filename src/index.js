const TelegramBot = require('node-telegram-bot-api');
const config = require('./utils/config');
const logger = require('./utils/logger');
const bot = require('./bot');

const telegramBot = new TelegramBot(config.TELEGRAM_BOT_TOKEN, { polling: true });

bot.initialize(telegramBot);

logger.info('Bot started');
