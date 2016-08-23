var path = require('path'),
    log4js = require('log4js'),
    request = require('request'),
    CachingMap = require('caching-map');
    MemoryStream = require('memorystream');

module.exports = function (opts) {

    const log = log4js.getLogger('cache');

    const cache = new CachingMap(1000);

    console.log("ONSTARTUP ", [ ...cache.keys() ]);
    cache.materialize = (dest) => {
        const promise = getWithPromise(dest);
        promise.then(function(response) {
            cache.set(dest, promise, { ttl: opts.ttl * 1000 });
        });
        return promise;
    };

    let stats = {requests: 0, hits: 0}

    this.cache = function() {
        return cache;
    }

    this.stats = function() {
        return stats;
    }

    this.clear = function() {
        cache.clear();
    }

    this.get = function (key) {
        stats.requests++;
        if (cache.has(key)) {
            stats.hits++;
        }

        return cache.get(key);
    };

    function getWithPromise(dest) {
        return new Promise( (resolve, reject) => {
            var onResponse = function(err, response) {
                if (!err && response.statusCode === 200) {
                    var stream = MemoryStream(null, {readable: false});
                    r.pipe(stream);

                    stream.on('finish', function () {
                        log.info("Fetch finished and cache (size %d)", stream.toBuffer().length);
                        resolve({
                            url: dest,
                            data: stream.toBuffer(),
                            contenttype: response.headers['content-type'],
                            etag: response.headers['etag'],
                            headers: response.headers,
                        });
                    });
                } else {
                    log.error('An error occcured: "%s", status code "%s"',
                            err ? err.message : 'Unknown',
                            response ? response.statusCode : 0
                            );
                    reject(`Status code: ${response.statusCode}`);
                }
            };


            var params = {
                url: dest,
                rejectUnauthorized: false
            };
            var r = request(params);
            r.on('response', onResponse.bind(null, null));
            r.on('error', onResponse.bind(null));
            r.on('end', function() {
                console.log("END");
                log.debug('end');
            });
        });
    }

}



