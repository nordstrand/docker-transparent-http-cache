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
    adminui = require('./adminui');

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

    var params = {
        url: dest,
        rejectUnauthorized: false
    };

    // Skipping other than GET methods
    if (req.method !== 'GET') {
        return bypass(req, res, params);
    }

    var cacheEntry = cache.read(dest);
    if (cacheEntry) {
        log.info('Respond with cache %s => %s (%d b)', dest, cacheEntry.contenttype, cacheEntry.data.length);
        return respondWithCache(cacheEntry, res);
    }

    log.info('Fetching: ', dest);

    var onResponse = function(err, response) {
        // don't save responses with codes other than 200
        if (!err && response.statusCode === 200) {
            var file = cache.write(dest, response);
            r.pipe(file);
            r.pipe(res, {end: false});
        } else {
            log.error('An error occcured: "%s", status code "%s"',
                      err ? err.message : 'Unknown',
                      response ? response.statusCode : 0
                     );
            res.end(err ? err.toString() : 'Status ' + response.statusCode + ' returned');
        }
    };

    var r = request(params);
    r.on('response', onResponse.bind(null, null));
    r.on('error', onResponse.bind(null));
    r.on('end', function() {
        log.debug('end');
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

    return cacheEntry.dataAsStream.pipe(res);
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