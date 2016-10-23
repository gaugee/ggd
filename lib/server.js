'use strict';

const fs = require('fs');
const Path = require('path');

const yaml = require('js-yaml');
const debug = require('debug')('server');
const async = require('async');

const API = require('./api.js');

class Server {
  start(args, callback) {

    var server = this;
    this.interfaces = [];
    this.config = {};

    server.loadConfig((err) => {
      server.loadAPI({ server: server }, (err) => {
        server.loadInterfaces((err) => {
          console.log('Server started');
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
      debug('config loading error: %s', e);
      return callback(e);
    }
    callback();
  }

  loadAPI(config, callback) {
    this.api = new API;
    let conf = {
      server: this,
      config: this.config
    };
    this.api.start(conf, (err) => {
      callback()
    });
  }

  loadInterfaces(callback) {
    let ifaces = Object.keys(this.config.interfaces);
    async.each(ifaces, (i, next) => {
      let conf = this.config.interfaces[i];
      let driver = conf.driver ? conf.driver : i;
      let IFACE = require('./interfaces/'+ driver +'.js');
      let iface = new IFACE();
      this.interfaces.push(iface);
      iface.start(this, conf, (err) => {
        debug('interface "%s" started at: %s', i, iface.info.uri);
        next();
      });
    }, (err) => {
      if (callback) { callback() };
    });
  }
}

module.exports = Server;
