'use strict';

class Tracker {

  constructor(data) {
    this.data = data;
    this.methods = {};
    require(data.runtime.path + '/index.js')(this);
  }
  
  init() {
  }

  register(method, handler) {
    this.methods[method] = handler;
  }
}

module.exports = Tracker
