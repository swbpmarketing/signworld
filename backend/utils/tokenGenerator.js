const crypto = require('crypto');

/**
 * Generate a secure verification or reset token
 * @returns {Object} { token: string, hash: string }
 */
function generateToken() {
  // Generate a random token (32 bytes = 256 bits)
  const token = crypto.randomBytes(32).toString('hex');

  // Hash the token with SHA-256 for secure storage
  const hash = crypto.createHash('sha256').update(token).digest('hex');

  return { token, hash };
}

/**
 * Get token expiration time (default 1 hour from now)
 * @param {Number} expiresInMinutes - Minutes from now (default: 60)
 * @returns {Date} Expiration date
 */
function getTokenExpiration(expiresInMinutes = 60) {
  return new Date(Date.now() + expiresInMinutes * 60 * 1000);
}

/**
 * Hash a token for comparison (when received from user)
 * @param {String} token - The token to hash
 * @returns {String} Hashed token
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Verify a token against its hash
 * @param {String} token - The token received from user
 * @param {String} hash - The stored hash
 * @returns {Boolean} True if token matches hash
 */
function verifyToken(token, hash) {
  const tokenHash = hashToken(token);
  return crypto.timingSafeEqual(
    Buffer.from(tokenHash),
    Buffer.from(hash)
  );
}

module.exports = {
  generateToken,
  getTokenExpiration,
  hashToken,
  verifyToken,
};
