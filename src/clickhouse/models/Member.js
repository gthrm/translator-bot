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

class Member {
  static async create(member) {
    const client = getClickHouseClient();
    const query = `
      INSERT INTO members (userId, username, firstName, lastName, action, timestamp, custom, languageCode, isPremium, isBot)
      VALUES (${member.userId}, '${member.username}', '${member.firstName}', '${member.lastName}', '${member.action}', '${member.timestamp.getTime()}', '${member.custom}', '${member.languageCode}', '${member.isPremium}', '${member.isBot}' )
    `;
    await client.exec({ query });
  }

  static async findByUserId(userId) {
    const client = getClickHouseClient();
    const query = `SELECT * FROM members WHERE userId = ${userId}`;
    const resultSet = await client.query({ query });
    const json = await resultSet.json();
    return json.data;
  }

  static async logMessageEvent(member) {
    const client = getClickHouseClient();

    const escapeString = (str) => str.replace(/'/g, "''");

    const insertQuery = `
        INSERT INTO members (userId, username, firstName, lastName, action, timestamp, custom, languageCode, isPremium, isBot, chatId)
        VALUES (${member.userId}, ${member.username === null ? 'NULL' : `'${escapeString(member.username)}'`},
        ${member.firstName === null ? 'NULL' : `'${escapeString(member.firstName)}'`},
        ${member.lastName === null ? 'NULL' : `'${escapeString(member.lastName)}'`}, '${member.action}',
        '${new Date(member.timestamp).toISOString().slice(0, 19).replace('T', ' ')}', '${member.custom}',
        '${member.languageCode}', '${member.isPremium}', '${member.isBot}', '${member.chatId}')
      `;
    await client.exec({ query: insertQuery });
  }
}

module.exports = { Member, EActions };
