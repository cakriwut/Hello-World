'use strict';

/**
 * Encode a numeric row id into an opaque base64 cursor string.
 * @param {number} id
 * @returns {string}
 */
function encodeCursor(id) {
  return Buffer.from(String(id), 'utf8').toString('base64');
}

/**
 * Decode a base64 cursor string back to a numeric row id.
 * Returns null if the cursor is missing/falsy.
 * Throws an Error if the cursor is present but malformed.
 * @param {string|undefined} cursor
 * @returns {number|null}
 */
function decodeCursor(cursor) {
  if (!cursor) return null;

  let decoded;
  try {
    decoded = Buffer.from(cursor, 'base64').toString('utf8');
  } catch {
    throw new Error('Invalid cursor');
  }

  const id = Number(decoded);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('Invalid cursor');
  }

  return id;
}

module.exports = { encodeCursor, decodeCursor };
