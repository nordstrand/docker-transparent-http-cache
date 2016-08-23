var restify = require('restify'),
    log4js = require('log4js');

module.exports = function(opts, cache) {

    var server = restify.createServer({
        name: 'MyApp'
    });

    server.get('/cache', function(req, res, next) {
        var m = [];

        for (let [url, p] of cache.cache()) {
            m.push(p);
        }

        Promise.all(m).then(entries => {
          console.log("resolve, ", entries);
          res.send({
            contents: entries.map(e => {
              return { 
                url: e.url,
                size: e.data.length
              };}),
            heapUsage: process.memoryUsage().heapUsed,
            hits: cache.stats().hits,
            requests: cache.stats().requests,
          });
          next();
        })
        .catch(reason => {
            console.log("CATCH ", reason);
        });
//            m.push({
//                url: url,
//                //expires: new Date(value.expires).toISOString(),
//                //contenttype: value.contenttype,
//                //hits: value.hits,
//                //used: new Date(value.used).toISOString(),
//                size: value.data.length
//                });
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
            ttl: opts.ttl,
            maxSize: opts.maxsize
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
