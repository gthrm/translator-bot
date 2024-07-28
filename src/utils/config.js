require('dotenv').config();

module.exports = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  CHAT_ID: process.env.CHAT_ID,
  AI_MODEL: process.env.AI_MODEL,
};
