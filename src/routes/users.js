'use strict';

const { Router } = require('express');
const { encodeCursor, decodeCursor } = require('../pagination');

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Build and return the /users router.
 * @param {object} db - node:sqlite DatabaseSync instance
 */
function usersRouter(db) {
  const router = Router();

  router.get('/', (req, res) => {
    // --- parse limit ---
    let limit = DEFAULT_LIMIT;
    if (req.query.limit !== undefined) {
      const parsed = Number(req.query.limit);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        return res.status(400).json({ error: 'limit must be a positive integer' });
      }
      limit = Math.min(parsed, MAX_LIMIT);
    }

    // --- parse cursor ---
    let afterId = 0;
    try {
      const decoded = decodeCursor(req.query.cursor);
      if (decoded !== null) afterId = decoded;
    } catch {
      return res.status(400).json({ error: 'Invalid cursor' });
    }

    // Fetch limit+1 rows to detect whether there is a next page
    const rows = db
      .prepare(
        'SELECT id, name, email FROM users WHERE id > ? ORDER BY id ASC LIMIT ?'
      )
      .all(afterId, limit + 1);

    const has_more = rows.length > limit;
    const data = has_more ? rows.slice(0, limit) : rows;

    const next_cursor =
      has_more ? encodeCursor(data[data.length - 1].id) : null;

    return res.json({
      data,
      pagination: {
        next_cursor,
        has_more,
      },
    });
  });

  return router;
}

module.exports = { usersRouter };
