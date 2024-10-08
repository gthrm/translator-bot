const { client } = require('./openai');
const config = require('../utils/config');
const logger = require('../utils/logger');

async function detectLanguage(text) {
  const response = await client.chat.completions.create({
    model: config.AI_MODEL,
    messages: [
      { role: 'system', content: "You are a language detection assistant. Respond with only 'ru' for Russian or 'sr' for Serbian. Serbian can be written in both latin and kurilian letters." },
      { role: 'user', content: `Detect the language of the following text: "${text}"` },
    ],
    max_tokens: 5,
  });

  return response.choices[0].message.content.trim();
}

function getStylePrompt(style) {
  const STYLES_KEYS = {
    PROFESSIONAL: 'Professional',
    CASUAL: 'Casual',
    AGGRESSIVE: 'Aggressive',
  };

  const styles = {
    [STYLES_KEYS.PROFESSIONAL]: 'professionally and formally',
    [STYLES_KEYS.CASUAL]: 'in a casual, friendly manner',
    [STYLES_KEYS.AGGRESSIVE]: 'in an aggressive, confrontational tone',
  };

  switch (style) {
    case STYLES_KEYS.PROFESSIONAL:
      return styles[STYLES_KEYS.PROFESSIONAL];

    case STYLES_KEYS.CASUAL:
      return styles[STYLES_KEYS.CASUAL];

    case STYLES_KEYS.AGGRESSIVE:
      return styles[STYLES_KEYS.AGGRESSIVE];

    default:
      return styles[STYLES_KEYS.PROFESSIONAL];
  }
}

async function translate(text, targetLanguage, style) {
  logger.info(`text: ${text}`);
  logger.info(`targetLanguage: ${targetLanguage}`);
  logger.info(`style: ${style}`);

  const prompt = `You are a translation assistant. Translate the given text ${getStylePrompt(style)} into ${targetLanguage === 'ru' ? 'Russian' : 'Serbian'}, using ${targetLanguage === 'ru' ? 'Cyrillic' : 'Latin'} script. Ensure that the translation accurately conveys the meaning of the original text, including any strong language or offensive terms, and adheres to the rules of the ${targetLanguage === 'ru' ? 'Russian' : 'Serbian'} language. Verify that the translation is correct and faithfully represents all elements of the original text. If strong language or offensive terms are present in the original text, translate them appropriately while retaining the intended impact. Respond with only the translation.`;

  logger.info(`Prompt: ${prompt}`);

  const translationsLevel1 = await client.chat.completions.create({
    model: config.AI_MODEL,
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: `The given text: ${text}` },
    ],
    max_tokens: config.MAX_TOKENS,
  });

  const translations = await client.chat.completions.create({
    model: config.AI_MODEL,
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: translationsLevel1.choices[0].message.content.trim() },
      { role: 'system', content: 'Verify that the translation is correct. If you find any inaccuracies, make the necessary corrections and provide the revised translation. If not return the original translation.' },
    ],
    max_tokens: config.MAX_TOKENS,
  });

  return translations.choices[0].message.content.trim();
}

module.exports = { detectLanguage, translate };
