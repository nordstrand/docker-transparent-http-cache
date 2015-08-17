var restify = require('restify'),
    log4js = require('log4js'),
    dot = require('dot');

module.exports = function(opts, cache) {

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
            ttl: opts.ttl
        });
        next();
    });


    server.get(/\/?.*/, restify.serveStatic({
        directory: './client',
        default: 'index.html'
    }));

    server.listen(opts.adminport, opts.host, function (err) {
        if (err) throw err;
        log4js.getLogger('admin-ui').info('Listening on %s:%s [%d]', opts.host, opts.adminport, process.pid);
    });
};