'use strict';

const Tingo = require('tingodb')();
const Path = require('path');

class TingoDriver {
  start(api, callback) {
    this.api = api;
    let path = Path.resolve(api.config.storage.path.replace('~', api.homedir));
    console.log('starting tingo..');
    console.log('database path: %s', path);
    var db = this.db = new Tingo.Db(path, {});
    var col = db.collection('test');
    col.insert({ test: 'yes' }, { w:1 }, (err) => {
      console.log(err);

      col.find({}, (err) => {
        callback();
      });
    });
  }
}

module.exports = TingoDriver;
