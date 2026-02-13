/**
 * Extract unique user IDs from mention-formatted text.
 * Mention format: @[Display Name](userId)
 * @param {string} text - The text containing mentions
 * @returns {string[]} Array of unique user ID strings
 */
function parseMentions(text) {
  if (!text) return [];
  const regex = /@\[([^\]]+)\]\(([a-f0-9]{24})\)/g;
  const ids = new Set();
  let match;
  while ((match = regex.exec(text)) !== null) {
    ids.add(match[2]);
  }
  return Array.from(ids);
}

module.exports = parseMentions;
