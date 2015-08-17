var restify = require('restify'),
    http = require('http'),
    dot = require('dot');

module.exports = function(log, cache) {
    var opts = {host: '0.0.0.0', port: 8888};

    var server = restify.createServer({
        name: 'MyApp'
    });

    server.get('/cache', function(req, res, next) {
        var m = [];
        for (var url of cache.cache().keys()) {
            var value = cache.cache().get(url);
            m.push({
                url: url,
                expires: new Date(value.expires).toString(),
                contenttype: value.contenttype,
                size: value.data.length});
        }
        res.send({
            contents: m,
            heapUsage: process.memoryUsage().heapUsed
        });
        next();
    });

    server.del('/cache', function(req, res, next) {
        cache.clear();
        res.send({status: 'ok'});
        next();
    });

    server.get('/meta', function(req, res, next) {
        res.send({
            applicationName: require('../package.json').name,
            applicationVersion: require('../package.json').version,
            target: process.env.TARGET_HOSTNAME,
        });
        next();
    });


    server.get(/\/?.*/, restify.serveStatic({
        directory: './client',
        default: 'index.html'
    }));

    server.listen(opts.port, opts.host, function (err) {
        if (err) throw err;
        log.info('Admin REST UI listening on %s:%s [%d]', opts.host, opts.port, process.pid);
    });
};