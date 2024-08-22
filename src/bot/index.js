const handlers = require('./handlers');
const logger = require('../utils/logger');

async function initialize(bot) {
  bot.on('message', async (msg) => {
    try {
      await handlers.handleMessage(bot, msg);
    } catch (error) {
      logger.error('Error handling message:', error);
      bot.sendMessage(msg.chat.id, 'Sorry, an error occurred. Please try again later.');
    }
  });

  bot.on('polling_error', (error) => {
    logger.error('Polling error:', error);
  });

  bot.on('callback_query', async (query) => {
    try {
      await handlers.handleCallbackQuery(bot, query);
    } catch (error) {
      logger.error('Error handling callback_query:', error);
      bot.sendMessage(query.chat.id, 'Sorry, an error occurred. Please try again later.');
    }
  });
  try {
    await handlers.setCommands(bot);
  } catch (error) {
    logger.error('Error setting commands:', error);
  }
}

module.exports = { initialize };
