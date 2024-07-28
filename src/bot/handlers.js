const translator = require('../services/translator');
const logger = require('../utils/logger');
const config = require('../utils/config');
const { NO_TEXT_FOUND, imageToText } = require('../services/openai');
const RateLimiter = require('../utils/rateLimiter');

const rateLimiter = new RateLimiter(5, 60 * 1000);

async function handleMessage(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!rateLimiter.isAllowed(userId)) {
    return bot.sendMessage(chatId, 'You have exceeded the rate limit. Please try again later.');
  }

  if (msg.text && msg.text.startsWith('/start')) {
    return bot.sendMessage(chatId, 'Welcome! Send me a message in Russian or Serbian, or send an image containing text, and I will translate it in three different styles.');
  }

  if (msg.photo) {
    const fileId = msg.photo[msg.photo.length - 1].file_id;
    const fileInfo = await bot.getFile(fileId);

    const maxSizeInBytes = 1024 * 1024 * 5; // 5 MB
    if (fileInfo.file_size > maxSizeInBytes) {
      return bot.sendMessage(chatId, 'The image is too large. Please send an image smaller than 5 MB.');
    }

    const imageUrl = `https://api.telegram.org/file/bot${config.TELEGRAM_BOT_TOKEN}/${fileInfo.file_path}`;

    const extractedText = await imageToText(imageUrl);

    if (extractedText === NO_TEXT_FOUND) {
      return bot.sendMessage(chatId, 'No text detected in the image for translation.');
    }

    const detectedLanguage = await translator.detectLanguage(extractedText);
    const targetLanguage = detectedLanguage === 'ru' ? 'sr' : 'ru';
    const translations = await translator.translate(extractedText, targetLanguage);

    let responseMessage = `Extracted text: ${extractedText}\n\n`;
    translations.forEach(({ style, translation }) => {
      responseMessage += `${style}:\n${translation}\n\n`;
    });

    return bot.sendMessage(chatId, responseMessage);
  }

  if (msg.text) {
    const detectedLanguage = await translator.detectLanguage(msg.text);
    logger.info(`detectedLanguage: ${detectedLanguage}`);

    const targetLanguage = detectedLanguage === 'ru' ? 'sr' : 'ru';
    logger.info(`targetLanguage: ${targetLanguage}`);

    const translations = await translator.translate(msg.text, targetLanguage);

    let responseMessage = `Original: ${msg.text}\n\n`;
    translations.forEach(({ style, translation }) => {
      responseMessage += `${style}:\n${translation}\n\n`;
    });

    return bot.sendMessage(chatId, responseMessage);
  }

  return bot.sendMessage(chatId, 'Please send a text message or an image containing text.');
}

module.exports = { handleMessage };
