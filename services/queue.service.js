const queues = require("../mock/queues");
const { calculateETA } = require("../utils/eta");

function checkIn(patientName, session) {
  const now = new Date();

  const todayQueues = queues.filter(
    q => q.session === session && q.status === "waiting"
  );

  if (todayQueues.length >= 20) {
    throw new Error("Session is full");
  }

  const position = todayQueues.length + 1;

  const queue = {
    id: queues.length + 1,
    patientName,
    status: "waiting",
    session,
    checkInTimestamp: now.getTime(),
    checkInTime: now.toLocaleString("th-TH"),
    position,
    eta: calculateETA(position, session),
    notified: false,
    notifiedAt: null
  };

  queues.push(queue);
  return queue;
}

function getNextWaitingQueue(session) {
  return queues.find(
    q => q.session === session && q.status === "waiting"
  );
}

module.exports = { checkIn, getNextWaitingQueue };