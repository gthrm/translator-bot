const path = require('path');

module.exports = {
  client: 'sqlite3',
  connection: {
    filename: path.join(__dirname, '../../database.sqlite'),
  },
  migrations: {
    directory: './migrations',
  },
  useNullAsDefault: true,
};
