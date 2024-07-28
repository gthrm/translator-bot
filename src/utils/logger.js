const { createLogger, format, transports } = require('winston');
const TelegramTransport = require('./telegram-transport');
const config = require('./config');

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
  ),
  defaultMeta: { service: config.TELEGRAM_BOT_TOKEN },
  transports: [

    new transports.File({ filename: 'quick-start-error.log', level: 'error' }),
    new transports.File({ filename: 'quick-start-combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple(),
    ),
  }));
}

const telegramTransport = new TelegramTransport({
  telegramBotToken: config.TELEGRAM_BOT_TOKEN,
  chatId: config.CHAT_ID,
});

logger.add(telegramTransport);

module.exports = logger;
