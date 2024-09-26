const fs = require('fs').promises;
const crypto = require('crypto');

const translator = require('../services/translator');
const logger = require('../utils/logger');
const config = require('../utils/config');
const { NO_TEXT_FOUND, imageToText, textToSpeech } = require('../services/openai');
const RateLimiter = require('../utils/rateLimiter');
const { getTranslationOptions, setSelectedTranslationStyle } = require('../utils/translationOptions');
const { Message, EActions } = require('../clickhouse/models/Message');

const rateLimiter = new RateLimiter(10, config.TIME_WINDOW, config.DAILY_LIMIT);

const textStore = new Map();

async function showMainMenu(bot, chatId) {
  const keyboard = {
    keyboard: [
      [{ text: '🤩 Subscribe Premium' }],
      [{ text: '🔄 Translate' }],
      [{ text: '⚙️ Settings' }],
      [{ text: 'ℹ️ Help' }],
      [{ text: '📶 Limits' }],
    ],
    resize_keyboard: true,
  };
  return bot.sendMessage(chatId, 'Main Menu:', { reply_markup: JSON.stringify(keyboard) });
}

async function showSettingsMenu(bot, chatId, selectedStyle) {
  const keyboard = {
    inline_keyboard: [
      [{ text: 'Professional', callback_data: 'set_professional' }],
      [{ text: 'Casual', callback_data: 'set_casual' }],
      [{ text: 'Aggressive', callback_data: 'set_aggressive' }],
    ],
  };

  return bot.sendMessage(
    chatId,
    `Current translation style: ${selectedStyle}\nChoose your preferred style:`,
    { reply_markup: JSON.stringify(keyboard) },
  );
}

async function translateText(text, targetLanguage, selectedStyle) {
  const translation = await translator.translate(text, targetLanguage, selectedStyle);
  return `${selectedStyle} translation:\n\`\`\`\n${translation}\n\`\`\`\n`;
}

async function handleTranslation(bot, chatId, text, selectedStyle) {
  const detectedLanguage = await translator.detectLanguage(text);
  logger.info(`detectedLanguage: ${detectedLanguage}`);

  const targetLanguage = detectedLanguage === 'ru' ? 'sr' : 'ru';
  logger.info(`targetLanguage: ${targetLanguage}`);

  const translatedText = await translateText(text, targetLanguage, selectedStyle);

  const textId = crypto.randomBytes(16).toString('hex');
  textStore.set(textId, { text: translatedText, language: targetLanguage });

  const keyboard = {
    inline_keyboard: [
      [{ text: '🔊 Озвучить', callback_data: `speak_${textId}` }],
    ],
  };

  return bot.sendMessage(chatId, translatedText, { reply_markup: JSON.stringify(keyboard), parse_mode: 'MarkdownV2' });
}

async function handleLimits(bot, chatId, userId) {
  const currentUserLimit = rateLimiter.getUserDayLimit(userId);

  return bot.sendMessage(chatId, `Your translation limit: ${currentUserLimit}`);
}

async function handleSubscribe(bot, chatId) {
  return bot.sendMessage(chatId, `Подпишись на наш паблик и получи больше возможностей для переводов! Link ${config.SUPPORT_LINK}`);
}

async function handleMessage(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const isBot = msg.from.is_bot;
  const user = msg.from;

  try {
    const message = {
      chatId,
      userId: user.id,
      username: user.username || null,
      firstName: user.first_name || null,
      lastName: user.last_name || null,
      action: EActions.MESSAGE,
      timestamp: new Date(),
      languageCode: user.language_code || null,
      isPremium: user.is_premium || false,
      isBot: user.is_bot || false,
    };

    await Message.insertMember(message);
  } catch (error) {
    logger.error('Error handling message:', error);
  }

  if (isBot) {
    return null;
  }

  const { selectedStyle } = await getTranslationOptions(userId);

  if (msg.text) {
    if (msg.text.startsWith('/start') || msg.text === '🔄 Translate') {
      return bot.sendMessage(chatId, 'Welcome! Send me a message in Russian or Serbian, or send an image containing text.');
    }

    if (msg.text.startsWith('/menu')) {
      return showMainMenu(bot, chatId);
    }

    if (msg.text.startsWith('/help') || msg.text === 'ℹ️ Help') {
      return bot.sendMessage(chatId, `For help, please contact @${config.SUPPORT_USERNAME}`);
    }

    if (msg.text.startsWith('/settings') || msg.text === '⚙️ Settings') {
      return showSettingsMenu(bot, chatId, selectedStyle);
    }

    if (msg.text.startsWith('/limit') || msg.text === '📶 Limits') {
      return handleLimits(bot, chatId, userId);
    }

    if (msg.text.startsWith('/subscribe') || msg.text === '🤩 Subscribe Premium') {
      return handleSubscribe(bot, chatId, userId);
    }

    if (!rateLimiter.isAllowed(userId)) {
      return bot.sendMessage(chatId, 'You have exceeded the rate limit. Please try again later.');
    }

    rateLimiter.decreaseDailyLimit(userId);

    if (!msg.text.startsWith('/')) {
      return handleTranslation(bot, chatId, msg.text, selectedStyle);
    }
  }

  if (msg.photo) {
    const fileId = msg.photo[msg.photo.length - 1].file_id;
    const fileInfo = await bot.getFile(fileId);

    if (fileInfo.file_size > 1024 * 1024 * 5) {
      return bot.sendMessage(chatId, 'The image is too large. Please send an image smaller than 5 MB.');
    }

    if (!rateLimiter.isAllowed(userId)) {
      return bot.sendMessage(chatId, 'You have exceeded the rate limit. Please try again later.');
    }

    rateLimiter.decreaseDailyLimit(userId);

    const imageUrl = `https://api.telegram.org/file/bot${config.TELEGRAM_BOT_TOKEN}/${fileInfo.file_path}`;
    const extractedText = await imageToText(imageUrl);

    if (extractedText === NO_TEXT_FOUND) {
      return bot.sendMessage(chatId, 'No text detected in the image for translation.');
    }

    await bot.sendMessage(chatId, `Extracted text: ${extractedText}\n\n`);
    return handleTranslation(bot, chatId, extractedText, selectedStyle);
  }

  return bot.sendMessage(chatId, 'Please send a text message or an image containing text.');
}

async function handleCallbackQuery(bot, callbackQuery) {
  const userId = callbackQuery.from.id;
  const chatId = callbackQuery.message.chat.id;
  const { data } = callbackQuery;

  if (data.startsWith('set_')) {
    const style = data.replace('set_', '');
    const capitalizedStyle = style.charAt(0).toUpperCase() + style.slice(1);
    await setSelectedTranslationStyle(userId, capitalizedStyle);
    await bot.answerCallbackQuery(callbackQuery.id, { text: `Translation style set to ${style}` });
    return bot.sendMessage(chatId, `Translation style has been set to ${style}.`);
  }

  if (data.startsWith('speak_')) {
    if (!rateLimiter.isAllowed(userId)) {
      return bot.sendMessage(chatId, 'You have exceeded the rate limit. Please try again later.');
    }

    rateLimiter.decreaseDailyLimit(userId);

    const textId = data.split('_')[1];
    const storedData = textStore.get(textId);

    if (!storedData) {
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Извините, текст больше не доступен.' });
      return null;
    }

    const { text, language } = storedData;

    textStore.delete(textId);

    try {
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Генерация аудио...' });

      const outputFilename = `speech_${userId}_${Date.now()}.mp3`;
      const speechFilePath = await textToSpeech(text, outputFilename, language);

      await bot.sendAudio(chatId, speechFilePath);

      await fs.unlink(speechFilePath);
    } catch (error) {
      logger.error('Error generating or sending audio:', error);
      await bot.sendMessage(chatId, 'Извините, произошла ошибка при генерации аудио.');
    }
  }

  return null;
}

module.exports = { handleMessage, handleCallbackQuery };
