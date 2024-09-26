const { getClickHouseClient } = require('../../db');

const EActions = {
  MESSAGE: 'message',
  EDITED_MESSAGE: 'edited_message',
  NEW_CHAT_MEMBERS: 'new_chat_members',
  LEFT_CHAT_MEMBER: 'left_chat_member',
  CHAT_MEMBER: 'chat_member',
  MESSAGE_REACTION: 'message_reaction',
  MESSAGE_REACTION_COUNT: 'message_reaction_count',
  CALLBACK_QUERY: 'callback_query',
  EDITED_CHANNEL_POST: 'edited_channel_post',
};

class Message {
  static async create(message) {
    const client = getClickHouseClient();
    const query = `
      INSERT INTO messages (userId, username, firstName, lastName, action, timestamp, custom, languageCode, isPremium, isBot)
      VALUES (${message.userId}, '${message.username}', '${message.firstName}', '${message.lastName}', '${message.action}', '${message.timestamp.getTime()}', '${message.custom}', '${message.languageCode}', '${message.isPremium}', '${message.isBot}' )
    `;
    await client.exec({ query });
  }

  static async findByMessageId(messageId) {
    const client = getClickHouseClient();
    const query = `SELECT * FROM messages WHERE messageId = ${messageId}`;
    const resultSet = await client.query({ query });
    const json = await resultSet.json();
    return json.data;
  }

  static async insertMember(message) {
    const client = getClickHouseClient();

    const escapeString = (str) => str.replace(/'/g, "''");

    const insertQuery = `
        INSERT INTO messages (userId, username, firstName, lastName, action, timestamp, custom, languageCode, isPremium, isBot, chatId)
        VALUES (${message.userId}, ${message.username === null ? 'NULL' : `'${escapeString(message.username)}'`},
        ${message.firstName === null ? 'NULL' : `'${escapeString(message.firstName)}'`},
        ${message.lastName === null ? 'NULL' : `'${escapeString(message.lastName)}'`}, '${message.action}',
        '${new Date(message.timestamp).toISOString().slice(0, 19).replace('T', ' ')}', '${message.custom}',
        '${message.languageCode}', '${message.isPremium}', '${message.isBot}', '${message.chatId}')
      `;
    await client.exec({ query: insertQuery });
  }
}

module.exports = { Message, EActions };
