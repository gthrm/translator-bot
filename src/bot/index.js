const handlers = require('./handlers');
const logger = require('../utils/logger');

function initialize(bot) {
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
}

module.exports = { initialize };
