function calculateETA(position, session) {
  const SLOT_MINUTES = 10;
  const baseHour = session === "morning" ? 8 : 13;

  const eta = new Date();
  eta.setHours(baseHour);
  eta.setMinutes((position - 1) * SLOT_MINUTES);
  eta.setSeconds(0);
  eta.setMilliseconds(0);

  return eta.toISOString();
}

module.exports = { calculateETA };