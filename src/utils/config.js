require('dotenv').config();

module.exports = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  CHAT_ID: process.env.CHAT_ID,
  AI_MODEL: process.env.AI_MODEL,
  SUPPORT_USERNAME: process.env.SUPPORT_USERNAME,
  MAX_TOKENS: parseInt(process.env.MAX_TOKENS || '300', 10),
  ADMIN_USERS: (process.env.ADMIN_USERS || '').split(','),
  TIME_WINDOW: parseInt(process.env.TIME_WINDOW || '60000', 10),
  DAILY_LIMIT: parseInt(process.env.DAILY_LIMIT || '10', 10),
  SUPPORT_LINK: process.env.SUPPORT_LINK,
  CLICKHOUSE_URL: process.env.CLICKHOUSE_URL,
  GROUP_ID: process.env.GROUP_ID,
};
