'use strict';

const express = require('express');
const { createDb } = require('./db');
const { usersRouter } = require('./routes/users');

/**
 * Create and return an Express application instance.
 * Accepts an optional pre-built db so tests can inject their own.
 * @param {object} [db] - node:sqlite DatabaseSync instance
 */
function createApp(db) {
  const database = db || createDb();
  const app = express();

  app.use(express.json());
  app.use('/users', usersRouter(database));

  return app;
}

module.exports = { createApp };

// Allow running directly: node src/app.js
if (require.main === module) {
  const app = createApp();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}
