const crypto = require('crypto');

/**
 * Generates a unique tracking ID in the format PKG-YYYYMMDD-XXXX
 * @returns {string}
 */
function generateTrackingId() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  const randomStr = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 4);

  return `PKG-${dateStr}-${randomStr}`;
}

module.exports = generateTrackingId;
