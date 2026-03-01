const queues = require("../mock/queues");

// GET /admin/queues
exports.getQueues = function (req, res) {
  res.json(queues);
};

// POST /admin/queues/:id/call
exports.callQueue = function (req, res) {
  const id = Number(req.params.id);
  const queue = queues.find(q => q.id === id);

  if (!queue) {
    return res.status(404).json({ message: "Queue not found" });
  }

  queue.status = "called";
  queue.doctorId = req.user.username;

  // notification mock
  console.log("[NOTI] Called:", queue.patientName);

  res.json(queue);
};

// POST /admin/queues/:id/skip
exports.skipQueue = function (req, res) {
  const id = Number(req.params.id);
  const queue = queues.find(q => q.id === id);

  if (!queue) {
    return res.status(404).json({ message: "Queue not found" });
  }

  queue.status = "skipped";
  queue.doctorId = req.user.username;

  // หา waiting ถัดไป (session เดียวกัน)
  const nextQueue = queues.find(
    q => q.status === "waiting" && q.session === queue.session
  );

  if (nextQueue) {
    nextQueue.status = "called";
    nextQueue.doctorId = req.user.username;

    console.log("[NOTI] Auto call:", nextQueue.patientName);
  }

  res.json({
    skippedQueue: queue,
    nextQueue: nextQueue || null,
  });
};