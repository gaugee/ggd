'use strict';

const OS = require('os');
const Path = require('path');
const fs = require('fs');
const debug = require('debug')('api');
const async = require('async');
const yaml = require('js-yaml');

const Tracker = require('./tracker.js');
const Runtime = require('./runtime.js');

class API {
  start(args, callback) {
    const api = this;
    this.worker = args.worker;
    this.config = args.config;
    this.homedir = OS.homedir();
    this.version = require('../package.json').version;
    this.trackers = [];

    this.initStorage(() => {

      api.run('tracker_scan', {}, () => {});
      debug('api started');
      callback();
    });
  }

  initStorage(callback) {
    let storage = this.worker.config.storage;
    let Driver = require('./storage/' + storage.driver + '.js');
    let driver = new Driver;
    driver.start(this, (config, err) => {
      debug('storage "%s" initialized', storage.driver);
      driver.test((err) => {
        if (err) {
          return callback(err);
        }
        debug('storage test pass');
        callback();
      });
    });
  }

  trackerVerify(path, callback) {
    callback();
  }

  trackerRun(trackerConfig, callback) {
    var tracker = new Tracker(trackerConfig);
    var runtime = new Runtime(tracker);
    runtime.init((err) => {
      runtime.run('default', {}, (err, data) => {
        callback(err, data);
      });
    });
  }

  trackerInfo(path, callback) {
    var data = yaml.safeLoad(fs.readFileSync(Path.resolve(path, 'ggt.yaml')));
    callback(null, data);
  }

  trackerDirScan(path, callback) {
    const api = this;
    var dir = fs.readdirSync(path);
    var trackers = [];

    async.each(dir, (name, next) => {
      var trackerPath = Path.resolve(path, name);
      api.trackerInfo(trackerPath, (err, tracker) => {
        if (err) { return next(err); }
        tracker.runtime = {
          path: trackerPath
        };
        trackers.push(tracker);
        next();
      });
    }, (err) => {

      debug('trackerDirScan done: %s', path);
      debug('found trackers: %s', trackers.length);
    });

    callback(null, trackers);
  }

  run(cmd, args, callback) {
    let target = 'cmd_' + cmd;
    if (!this[target]) {
      return callback('no target');
    }
    this[target](args, callback);
  }

  cmd_ggd(args, callback) {
    callback(null, { ggd: this.version });
  }

  cmd_tracker_run(args, callback) {
    if (!args.target) { return callback('no target'); }

    for (var tracker of this.trackers) {
      if (tracker.id == args.target) {
        return this.trackerRun(tracker, (err, output) => {
          callback(null, output);
        });
      }
    }
    callback('tracker not found');
  }

  cmd_tracker_add(args, callback) {
    callback(null, { blabla: 1 });
  }

  cmd_tracker_list(args, callback) {
    callback(null, this.trackers);
  }

  cmd_tracker_scan(args, callback) {
    const api = this;
    var path = Path.resolve(this.homedir, '.gg', 'trackers');
    this.trackerDirScan(path, (err, trackers) => {
      api.trackers = trackers;
    });
    callback()
  }

}

module.exports = API;
