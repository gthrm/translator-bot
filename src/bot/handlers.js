const translator = require('../services/translator');
const logger = require('../utils/logger');

async function handleMessage(bot, msg) {
  const chatId = msg.chat.id;
  const { text } = msg;
  if (!text) {
    return null;
  }

  if (text.startsWith('/start')) {
    return bot.sendMessage(chatId, 'Welcome! Send me a message in Russian or Serbian, and I will translate it in three different styles.');
  }

  const detectedLanguage = await translator.detectLanguage(text);
  logger.info(`detectedLanguage: ${detectedLanguage}`);

  const targetLanguage = detectedLanguage === 'ru' ? 'sr' : 'ru';
  logger.info(`targetLanguage: ${targetLanguage}`);

  const translations = await translator.translate(text, targetLanguage);

  let responseMessage = `Original: ${text}\n\n`;
  translations.forEach(({ style, translation }) => {
    responseMessage += `${style}:\n${translation}\n\n`;
  });

  return bot.sendMessage(chatId, responseMessage);
}

module.exports = { handleMessage };
