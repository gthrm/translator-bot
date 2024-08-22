# Russian-Serbian Translator Bot

A Telegram bot for translating between Russian and Serbian languages using AI.

## Features

- Instant translation between Russian and Serbian
- Three translation styles: professional, casual, aggressive
- Automatic input language detection
- Image-to-text recognition using GPT-4 vision capabilities
- Uses OpenAI API for accurate translations
- Supports both Cyrillic and Latin scripts

## Installation

1. Clone the repository:
   `
   git clone https://github.com/gthrm/translator-bot
   `

2. Navigate to the project directory:
   `
   cd translator-bot
   `

3. Install dependencies:
   `
   npm install
   `

4. Create a .env file in the root directory and add the following variables:
   `
    TELEGRAM_BOT_TOKEN=your_telegram_bot_token
    OPENAI_API_KEY=your_openai_api_key
    CHAT_ID=your_chat_id
    AI_MODEL=your_chat_id
    SUPPORT_USERNAME=telegram_user_name
    MAX_TOKENS=300
   `

## Running the Bot

To start the bot, run:

`
npm start
`

## Usage

1. Find the bot on Telegram: @YourBotUsername
2. Start a chat and send /start
3. Send any text in Russian or Serbian
4. Or send an image containing text for recognition and translation (using GPT-4 vision model)
5. Receive the translation in three styles

## Development

- src/index.js: Application entry point
- src/bot/: Telegram bot logic
- src/services/: Services for working with OpenAI API
- src/utils/: Utilities (logger, configuration)

## License

[MIT](https://choosealicense.com/licenses/mit/)