const { Configuration, OpenAIApi } = require('openai');
const config = require('../utils/config');
const logger = require('../utils/logger');

const configuration = new Configuration({
  apiKey: config.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const NO_TEXT_FOUND = 'No text found in the image.';

async function imageToText(imageUrl) {
  logger.info(`imageUrl: ${imageUrl}`);

  const response = await openai.createChatCompletion({
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

  return response.data.choices[0].message.content;
}

module.exports = { openai, imageToText, NO_TEXT_FOUND };
