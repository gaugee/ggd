'use strict';

const fs = require('fs');
const Path = require('path');

const Hapi = require('hapi');
const program = require('commander');
const yaml = require('js-yaml');
const debug = require('debug')('worker');
const async = require('async');

const API = require('./api.js');

class Worker {
  start(args, callback) {

    var worker = this;
    this.interfaces = [];
    this.config = {};

    this.loadConfig((err) => {
      if (err) {
        debug('config loading error: %s', err);
        if(callback) callback(err);
        return false;
      }

      this.api = new API;
      let conf = {
        worker: worker,
        config: worker.config
      };
      this.api.start(conf, () => {

        async.each(Object.keys(worker.config.interfaces), (i, next) => {
          let conf = worker.config.interfaces[i];
          let driver = conf.driver ? conf.driver : i;
          let IFACE = require('./interfaces/'+ driver +'.js');
          let iface = new IFACE();
          this.interfaces.push(iface);
          iface.start(this, conf, (err) => {
            debug('interface "%s" started at: %s', i, iface.info.uri);
            next();
          });
        }, (err) => {

          console.log('Worker started');
          if (callback) { callback() };
        });
      });
    });

  }

  loadConfig(callback) {
    try {
      let path = Path.resolve(__dirname, '../config/ggdrc');
      let doc = yaml.safeLoad(fs.readFileSync(path), 'utf8');
      this.config = doc;
    } catch (e) {
      callback(e);
    }
    callback();
  }
}

module.exports = Worker;
