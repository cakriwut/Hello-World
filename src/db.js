'use strict';

const { DatabaseSync } = require('node:sqlite');

/**
 * Create and seed an in-memory SQLite database with 50 users.
 * Returns the db instance.
 */
function createDb() {
  const db = new DatabaseSync(':memory:');

  db.exec(`
    CREATE TABLE users (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL
    )
  `);

  const insert = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)');

  for (let i = 1; i <= 50; i++) {
    insert.run(`User ${i}`, `user${i}@example.com`);
  }

  return db;
}

module.exports = { createDb };
