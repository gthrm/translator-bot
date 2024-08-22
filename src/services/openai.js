const OpenAI = require('openai');

const fs = require('fs');
const path = require('path');
const config = require('../utils/config');
const logger = require('../utils/logger');

const client = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
});

const NO_TEXT_FOUND = 'No text found in the image.';

async function imageToText(imageUrl) {
  logger.info(`imageUrl: ${imageUrl}`);

  const response = await client.chat.completions.create({
    model: config.AI_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: `Read and transcribe all the text you see in this image. If there's no text, write '${NO_TEXT_FOUND}'.` },
          {
            type: 'image_url',
            image_url: {
              url: imageUrl,
            },
          },
        ],
      },
    ],
    max_tokens: config.MAX_TOKENS,
  });

  return response.choices[0].message.content;
}

async function textToSpeech(text, outputFilename = 'speech.mp3') {
  try {
    const speechFile = path.resolve(outputFilename);

    const mp3 = await client.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: text,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    await fs.promises.writeFile(speechFile, buffer);

    logger.info(`Speech file created: ${speechFile}`);
    return speechFile;
  } catch (error) {
    logger.error('Error creating speech file:', error);
    throw error;
  }
}

module.exports = {
  client, imageToText, textToSpeech, NO_TEXT_FOUND,
};
