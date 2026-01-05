/**
 * Calculate convention status based on start and end dates
 * @param {Date} startDate - Convention start date
 * @param {Date} endDate - Convention end date
 * @returns {string} 'upcoming', 'ongoing', or 'past'
 */
function getConventionStatus(startDate, endDate) {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now < start) return 'upcoming';
  if (now >= start && now <= end) return 'ongoing';
  return 'past';
}

module.exports = { getConventionStatus };
