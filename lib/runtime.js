'use strict';

const debug = require('debug')('runtime');

class Runtime {
  constructor(tracker) {
    this.tracker = tracker;
  }

  init(callback) {
    callback();
  }

  run(method, args, callback) {
    debug('run tracker: %s method: %s', this.tracker.data.id, method);
    this.tracker.methods[method](args, (err, output) => {
      callback(err, output);
    });
  }
}

module.exports = Runtime;
