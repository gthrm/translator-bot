const handlers = require('./handlers');
const logger = require('../utils/logger');

async function setCommands(bot) {
  try {
    const commands = [
      { command: 'start', description: 'Start the bot' },
      { command: 'menu', description: 'Show main menu' },
      { command: 'subscribe', description: 'Subscribe to the premium bot' },
      { command: 'settings', description: 'Change translation settings' },
      { command: 'help', description: 'Get help' },
      { command: 'limit', description: 'Get limit' },
    ];

    const result = await bot.setMyCommands(commands);
    logger.info('Commands set successfully:', result);
  } catch (error) {
    logger.error('Error setting commands:', error);
  }
}

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
    await setCommands(bot);
  } catch (error) {
    logger.error('Error setting commands:', error);
  }
}

module.exports = { initialize };
