const db = require('../database');

async function getTranslationOptions(userId) {
  let options = await db('translation_options').where({ userId }).first();
  if (!options) {
    options = { userId, selectedStyle: 'Professional' };

    await db('translation_options').insert(options);
  }
  return options;
}

async function setTranslationOptions(userId, options) {
  await db('translation_options')
    .where({ userId })
    .update(options);
}

async function setSelectedTranslationStyle(userId, style) {
  await db('translation_options')
    .where({ userId })
    .update({ selectedStyle: style });
}

module.exports = { getTranslationOptions, setTranslationOptions, setSelectedTranslationStyle };
