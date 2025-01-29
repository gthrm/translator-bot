const config = require('./config');
const logger = require('./logger');

class RateLimiter {
  constructor(limit, timeWindow, dayLimit) {
    this.dayLimit = dayLimit;
    this.limit = limit;
    this.timeWindow = timeWindow;
    this.users = new Map();
  }

  getUserData(userId) {
    return this.users.get(userId);
  }

  getUserDayLimit(userId) {
    logger.info(`getUserDayLimit: ${userId}`);
    return this.getUserData(userId)?.dayLimit || this.dayLimit;
  }

  decreaseDailyLimit(userId) {
    const userData = this.getUserData(userId);
    const dailyLimit = userData?.dayLimit;

    if (dailyLimit && dailyLimit > 0) {
      this.getUserData(userId).dayLimit--;
    }
  }

  static async isUserInGroup(userId, bot) {
    try {
      const member = await bot.getChatMember(config.GROUP_ID, userId);

      return ['member', 'administrator', 'creator'].includes(member.status);
    } catch (error) {
      logger.error(`isUserInGroup error: ${error.message}`);
      return false;
    }
  }

  async isAllowed(userId, bot) {
    const now = Date.now();

    if (await RateLimiter.isUserInGroup(userId, bot)) {
      return true;
    }

    if (!this.users.has(userId)) {
      this.users.set(userId, {
        count: 1,
        lastReset: now,
        dayLimit: this.dayLimit,
      });
      return true;
    }

    const userData = this.getUserData(userId);

    if (userData.dayLimit <= 0) {
      return false;
    }

    if (now - userData.lastReset > 24 * 60 * 60 * 1000) {
      userData.count = 1;
      userData.lastReset = now;
      userData.dayLimit = this.dayLimit;

      return true;
    }

    if (now - userData.lastReset > this.timeWindow) {
      userData.count = 1;
      userData.lastReset = now;

      return true;
    }

    if (userData.count < this.limit) {
      userData.count++;

      return true;
    }

    return false;
  }
}

module.exports = RateLimiter;
