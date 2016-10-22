'use strict';

const Lawncipher = require('lawncipher');
const Path = require('path');
const async = require('async');

class Driver {

  start(api, callback) {
    let path = Path.resolve(api.config.storage.path.replace('~', api.homedir));
    this.db = new Lawncipher.db(path);
    this.db.openWithPassword(api.config.storage.password, callback);
    this.debug = require('debug')('storage:lawncipher');
  }

  test(callback) {

    var testId = null;
    var debug = this.debug;
    this.db.collection('test', {}, (err, c) => {

      async.series([

        (next) => {
          c.save({ test: false, date: new Date() }, [ '_id' ], (err, id) => {
            if (err) {
              console.log('error: %s', err);
              return callback(err);
            }
            testId = id;
            debug('test document inserted: ' + id);
            next();
          });
        },

        (next) => {
          c.findOne(testId, (err, item) => {
            if (err) {
              console.log(err);
              return callback(err);
            }
            debug(item);
            next();
          });
        },

        (next) => {
          c.remove(testId, (err, stat) => {
            if (err) {
              return callback(err);
            }
            if (stat == 0) {
              return callback('test document not found');
            }
            debug('test document deleted');
            callback();
          });
        },
        callback
      ]);
    });
  }
}

module.exports = Driver;
