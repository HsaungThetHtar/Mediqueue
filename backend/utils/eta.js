const SLOT_MINUTES = 15;

// timeSlot: "morning" | "afternoon"
function calculateETA(position, timeSlot) {
  const baseHour = timeSlot === "morning" ? 8 : 13;
  const totalMinutes = (position - 1) * SLOT_MINUTES;

  const eta = new Date();
  eta.setHours(baseHour, totalMinutes, 0, 0);

  return eta.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

module.exports = { calculateETA };
