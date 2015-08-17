var path = require('path'),
    log4js = require('log4js'),
    MemoryStream = require('memorystream');

module.exports = function (opts) {

    var log = log4js.getLogger('cache');

    var cache = new Map();
    setInterval(reapExpiredEntries, opts.ttl*1000 / 2);

    this.cache = function() {
        return new Map(cache);
    }

    this.clear = function() {
        cache = new Map();
    }

    this.read = function (key) {
        var cacheEntry = cache.get(key);

        if (cacheEntry && cacheEntry.expires > Date.now()) {
            cacheEntry.dataAsStream = new MemoryStream(cacheEntry.data);
            return cacheEntry;
        }

        return undefined;
    };


    this.write = function (key, res) {
        var stream = MemoryStream(null, {readable: false});

        stream.on('finish', (function () {
            cache.set(key, {
                data: stream.toBuffer(),
                contenttype: res.headers['content-type'],
                etag: res.headers['etag'],
                headers: res.headers,
                expires: Date.now() + opts.ttl * 1000
            });
            log.info("Fetch finished and cache (size %d) updated: %s", cache.size, key);
        }).bind(this));

        return stream;
    };


    function reapExpiredEntries() {
        for (var key of cache.keys()) {
            var cacheEntry = cache.get(key);

            if (cacheEntry.expires < Date.now()) {
                cache.delete(key);
                log.info("Removed expired cache entry (size %d): %s", cache.size, key);
            }
        }
    }
}



