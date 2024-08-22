const { openai } = require('./openai');
const config = require('../utils/config');

async function detectLanguage(text) {
  const response = await openai.createChatCompletion({
    model: config.AI_MODEL,
    messages: [
      { role: 'system', content: "You are a language detection assistant. Respond with only 'ru' for Russian or 'sr' for Serbian. Serbian can be written in both latin and kurilian letters." },
      { role: 'user', content: `Detect the language of the following text: "${text}"` },
    ],
    max_tokens: 5,
  });

  return response.data.choices[0].message.content.trim().toLowerCase();
}

async function translate(text, targetLanguage) {
  const styles = [
    { name: 'Professional', prompt: 'Translate professionally and formally.' },
    { name: 'Casual', prompt: 'Translate in a casual, friendly manner.' },
    { name: 'Aggressive', prompt: 'Translate in an aggressive, confrontational tone.' },
  ];

  const translations = await Promise.all(styles.map(async (style) => {
    const response = await openai.createChatCompletion({
      model: config.AI_MODEL,
      messages: [
        { role: 'system', content: `You are a translation assistant. ${style.prompt} Translate the given text from to ${targetLanguage === 'ru' ? 'Russian' : 'Serbian'}. Respond with only the translation. Use latin letters only for Serbian. And kurilian letters only for Russian.` },
        { role: 'user', content: text },
      ],
      max_tokens: 150,
    });

    return {
      style: style.name,
      translation: response.data.choices[0].message.content.trim(),
    };
  }));

  return translations;
}

module.exports = { detectLanguage, translate };
