const logger = require('../utils/logger');
const { Message } = require('./models/Message');

async function logMessageEvent(logMessage, customEventString) {
  try {
    logger.info('New Message', logMessage);
    await Message.logMessageEvent({ ...logMessage, custom: customEventString });
  } catch (error) {
    logger.error('Error handling message:', error, logMessage);
  }
}

module.exports = { logMessageEvent };
