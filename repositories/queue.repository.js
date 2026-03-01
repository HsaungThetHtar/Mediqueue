const queues = require("../mock/queues");

exports.findAll = () => queues;

exports.findById = (id) => {
  return queues.find(q => q.id === id);
};

exports.create = (queue) => {
  queues.push(queue);
  return queue;
};

exports.update = () => true;