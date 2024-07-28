const TelegramBot = require('node-telegram-bot-api');
const Transport = require('winston-transport');

class TelegramTransport extends Transport {
  constructor(opts) {
    super(opts);
    this.telegramBot = new TelegramBot(opts.telegramBotToken, { polling: false });
    this.chatId = opts.chatId;
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    if (info.level === 'error') {
      const message = `[${info.level.toUpperCase()}] - ${info.timestamp} - ${info.message}`;
      this.telegramBot.sendMessage(this.chatId, message)
        .then(() => callback())
        .catch((error) => console.error('Error sending message to Telegram:', error));
    } else {
      callback();
    }
  }
}

module.exports = TelegramTransport;
