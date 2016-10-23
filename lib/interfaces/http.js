'use strict';

const Hapi = require('hapi');
const async = require('async');
const Path = require('path');

class HTTP {
  start(worker, config, callback) {

    const iface = this;
    this.server = new Hapi.Server();
    this.worker = worker;
    this.config = config;

    async.series([
      (next) => {
        if (config.tls) {

          require('ssl-root-cas')
            .inject()
            .addFile(Path.join(__dirname, '../../config', 'localhost.cert.pem'));

          iface.generateCert({}, (err, keys) => {
            config.tls = {
              key: keys.serviceKey,
              cert: keys.certificate
            };
            next();
          });
        } else { next(); }
      },
      () => {
        iface.startServer(config, () => {
          if (callback) { callback(); }
        });
      },
    ]);
  }

  defaultHandler(req, reply) {
    const api = this.worker.api;
    var cmd = req.params.cmd;
    var args = {};

    if (req.params.subCmd) {
      cmd = cmd + '_' + req.params.subCmd;
    }
    if(req.params.target) {
      args.target = req.params.target;
    }
    api.run(cmd, args, (err, output) => {
      if (err) {
        return reply({ error: err }).code(500);
      }
      return reply(output);
    });
  }

  startServer(config, callback) {
    const server = this.server;
    const api = this.worker.api;
    server.connection({
      host: config.host,
      port: config.port,
      tls: config.tls ? config.tls : false
    });

    server.route({
      method: 'GET',
      path: '/{cmd}',
      handler: (req, reply) => {
        return this.defaultHandler(req, reply);
      }
    });

    server.route({
      method: 'GET',
      path: '/{cmd}/{subCmd}/{target?}',
      handler: (req, reply) => {
        return this.defaultHandler(req, reply);
      }
    });

    server.start((err) => {
      if (err) {
        throw err;
      }
      this.info = {
        uri: server.info.uri,
        port: server.info.port,
        address: server.info.address
      };
      if (callback) { callback(err) };
    });
  }

  generateCert(args, callback) {
    const pem = require('pem');
    pem.createCertificate({ days: -1, selfSigned: true }, (err, keys) => {
      callback(err, keys);
    });
  }
}

module.exports = HTTP;
