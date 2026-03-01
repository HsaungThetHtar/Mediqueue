const queues = [
  {
    id: 1,
    patientName: "Somchai",
    status: "waiting", // waiting | called | skipped | no-show | done
    session: "morning",
    checkInAt: new Date().toISOString(),
  },
  {
    id: 2,
    patientName: "Suda",
    status: "waiting",
    session: "morning",
    checkInAt: new Date().toISOString(),
  },
];

module.exports = queues;