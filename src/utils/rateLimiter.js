class RateLimiter {
  constructor(limit, timeWindow) {
    this.limit = limit;
    this.timeWindow = timeWindow;
    this.users = new Map();
  }

  isAllowed(userId) {
    const now = Date.now();
    if (!this.users.has(userId)) {
      this.users.set(userId, { count: 1, lastReset: now });
      return true;
    }

    const userData = this.users.get(userId);
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
