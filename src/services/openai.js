const { Configuration, OpenAIApi } = require('openai');
const config = require('../utils/config');

const configuration = new Configuration({
  apiKey: config.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

module.exports = openai;
