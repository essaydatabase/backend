const rand = function() {
  return Math.random()
    .toString(36)
    .substr(2);
};

module.exports = { rand };