var http = require('http'),
    net = require('net'),
    https = require('https'),
    fs = require('fs'),
    os = require('os'),
    request = require('request'),
    url = require('url'),
    log4js = require('log4js'),
    pem = require('pem'),
    Cache = require('./cache'),
    adminui = require('./adminui'),
    MemoryStream = require('memorystream');

exports.log = null;
exports.cache = null;


exports.powerup = function(opts) {
    opts = opts || {};

    this.log = log4js.getLogger('proxy');
    this.log.setLevel(opts.verbose ? 'DEBUG' : 'INFO');
    this.cache = new Cache(opts, this.log);

    if (! process.env.TARGET_HOSTNAME) {
        exports.log.error("TARGET_HOSTNAME environment variable not set.")
        process.exit(1);
    }

    launchHttpsServer(opts);

    http.createServer(this.handler).listen(opts.httpport, opts.host, function(err) {
        if (err) throw err;
        log4js.getLogger('http-proxy').info('Proxying http %s:%s => %s [%d]', opts.host, opts.httpport,  process.env.TARGET_HOSTNAME, process.pid);
    });

    adminui(opts,this.cache);
};

exports.handler = function(req, res) {
  var cache = exports.cache,
  log = exports.log,
  path = url.parse(req.url).path,
  schema = Boolean(req.client.pair) ? 'https' : 'http',
  dest = schema + '://' + process.env.TARGET_HOSTNAME + path;

  // Skipping other than GET methods
  if (req.method !== 'GET') {
    return bypass(req, res, params);
  }

  cache.get(dest).then(
      function(cacheEntry) {
        log.info('Respond with cache %s => %s (%d b)', dest, cacheEntry.contenttype, cacheEntry.data.length);
        return respondWithCache(cacheEntry, res);
      },
      function(error) {
        log.info('ERRORRRR' + error);
      });
};


function bypass(req, res, params) {
  var length = parseInt(req.headers['content-length']);

  if (isNaN(length) || !isFinite(length))
    throw new Error('Content-Length header not found or invalid');

  var raw = new Buffer(length),
  pointer = 0;

  req.on('data', function(chunk) {
    chunk.copy(raw, pointer);
    pointer += chunk.length;
  });

  req.on('end', function() {
    params.method = req.method;
    params.body = raw;
    params.headers = {
      'Content-Type': req.headers['content-type']
    };
    return request(params).pipe(res);
  });
}

function respondWithCache(cacheEntry, res) {
  var log = exports.log;

  Object.keys(cacheEntry.headers).forEach(function(name) {
    var value = cacheEntry.headers[name];
    res.setHeader(name, value);
  });

  return new MemoryStream(cacheEntry.data).pipe(res);
}


function launchHttpsServer(opts) {
    var caKey = require('fs').readFileSync('rootCA.key').toString();
    var caCert = require('fs').readFileSync('rootCA.pem').toString();

    pem.createCertificate({
        commonName: process.env.TARGET_HOSTNAME,
        serviceKey: caKey,
        serviceCertificate: caCert,
        serial: Date.now()
    }, function (err, keys) {
        if (err) throw err;
        https.createServer({key: keys.clientKey, cert: keys.certificate}, exports.handler)
            .listen(opts.httpsport, opts.host, function (err) {
                if (err) throw err;
                log4js.getLogger('https-proxy').info('Proxying https %s:%s => %s [%d]', opts.host, opts.httpsport, process.env.TARGET_HOSTNAME, process.pid);
            });
    });
}
