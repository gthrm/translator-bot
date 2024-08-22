const translator = require('../services/translator');
const logger = require('../utils/logger');
const config = require('../utils/config');
const { NO_TEXT_FOUND, imageToText } = require('../services/openai');
const RateLimiter = require('../utils/rateLimiter');
const { getTranslationOptions, setSelectedTranslationStyle } = require('../utils/translationOptions');

const rateLimiter = new RateLimiter(10, 60 * 1000);

async function setCommands(bot) {
  try {
    const result = await bot.setMyCommands([
      { command: 'start', description: 'Start the bot' },
      { command: 'menu', description: 'Show main menu' },
      { command: 'settings', description: 'Change translation settings' },
      { command: 'help', description: 'Get help' },
    ]);
    logger.info('Commands set successfully:', result);
  } catch (error) {
    logger.error('Error setting commands:', error);
  }
}

async function showMainMenu(bot, chatId) {
  const keyboard = {
    keyboard: [
      [{ text: '🔄 Translate' }],
      [{ text: '⚙️ Settings' }],
      [{ text: 'ℹ️ Help' }],
    ],
    resize_keyboard: true,
  };
  return bot.sendMessage(chatId, 'Main Menu:', { reply_markup: JSON.stringify(keyboard) });
}

async function handleMessage(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!rateLimiter.isAllowed(userId)) {
    return bot.sendMessage(chatId, 'You have exceeded the rate limit. Please try again later.');
  }

  if (msg.text && (msg.text.startsWith('/start') || msg.text === '🔄 Translate')) {
    return bot.sendMessage(chatId, 'Welcome! Send me a message in Russian or Serbian, or send an image containing text.');
  }

  if (msg.text && msg.text.startsWith('/menu')) {
    return showMainMenu(bot, chatId);
  }

  if (msg.text && (msg.text.startsWith('/help') || msg.text === 'ℹ️ Help' || msg.text.startsWith('/help'))) {
    return bot.sendMessage(chatId, `For help, please contact @${config.SUPPORT_USERNAME}`);
  }

  if (msg.text && (msg.text.startsWith('/settings') || msg.text === '⚙️ Settings')) {
    const { selectedStyle } = await getTranslationOptions(userId);
    const keyboard = {
      inline_keyboard: [
        [{ text: 'Professional', callback_data: 'set_professional' }],
        [{ text: 'Casual', callback_data: 'set_casual' }],
        [{ text: 'Aggressive', callback_data: 'set_aggressive' }],
      ],
    };
    return bot.sendMessage(chatId, `Current translation style: ${selectedStyle}\nChoose your preferred style:`, { reply_markup: JSON.stringify(keyboard) });
  }

  const { selectedStyle } = await getTranslationOptions(userId);

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
    const translation = await translator.translate(extractedText, targetLanguage, [{ style: selectedStyle, enabled: true }]);

    let responseMessage = `Extracted text: ${extractedText}\n\n`;
    responseMessage += `${selectedStyle} translation:\n${translation[0].translation}\n`;

    return bot.sendMessage(chatId, responseMessage);
  }

  if (msg.text && !msg.text.startsWith('/')) {
    const detectedLanguage = await translator.detectLanguage(msg.text);
    logger.info(`detectedLanguage: ${detectedLanguage}`);

    const targetLanguage = detectedLanguage === 'ru' ? 'sr' : 'ru';
    logger.info(`targetLanguage: ${targetLanguage}`);

    const translation = await translator.translate(msg.text, targetLanguage, [{ style: selectedStyle, enabled: true }]);

    let responseMessage = `Original: ${msg.text}\n\n`;
    responseMessage += `${selectedStyle} translation:\n${translation[0].translation}\n`;

    return bot.sendMessage(chatId, responseMessage);
  }

  return bot.sendMessage(chatId, 'Please send a text message or an image containing text.');
}

async function handleCallbackQuery(bot, callbackQuery) {
  const userId = callbackQuery.from.id;
  const chatId = callbackQuery.message.chat.id;
  const { data } = callbackQuery;

  if (data.startsWith('set_')) {
    const style = data.replace('set_', '');
    await setSelectedTranslationStyle(userId, style.charAt(0).toUpperCase() + style.slice(1));
    await bot.answerCallbackQuery(callbackQuery.id, { text: `Translation style set to ${style}` });
    return bot.sendMessage(chatId, `Translation style has been set to ${style}.`);
  }

  return null;
}

module.exports = { handleMessage, handleCallbackQuery, setCommands };
