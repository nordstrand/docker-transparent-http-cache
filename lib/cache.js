var path = require('path'),
    log4js = require('log4js'),
    MemoryStream = require('memorystream');

module.exports = function (opts) {

    var log = log4js.getLogger('cache');

    var cache = new Map();
    var stats = {requests: 0, hits: 0}
    setInterval(reapExpiredEntries, opts.ttl*1000 / 2);

    this.cache = function() {
        return new Map(cache);
    }

    this.stats = function() {
        return stats;
    }

    this.clear = function() {
        cache = new Map();
    }

    this.read = function (key) {
        stats.requests++;

        var cacheEntry = cache.get(key);

        if (cacheEntry && cacheEntry.expires > Date.now()) {
            stats.hits++;
            cacheEntry.used = Date.now();
            cacheEntry.hits++;
            cacheEntry.dataAsStream = new MemoryStream(cacheEntry.data);
            return cacheEntry;
        }

        return undefined;
    };


    this.write = function (key, res) {
        var stream = MemoryStream(null, {readable: false});

        stream.on('finish', (function () {
            if (cache.size >= opts.maxsize) {
                removeOverflow();
            }

            var now = Date.now();
            cache.set(key, {
                data: stream.toBuffer(),
                contenttype: res.headers['content-type'],
                etag: res.headers['etag'],
                headers: res.headers,
                used: now,
                hits: 0,
                expires: now + opts.ttl * 1000
            });
            log.info("Fetch finished and cache (size %d) updated: %s", cache.size, key);
        }).bind(this));

        return stream;
    };

    function removeOverflow() {
        var limit = getLimit();

        for (var url of cache.keys()) {
            var value = cache.get(url);

            if (value.used <= limit) {
                cache.delete(url);
                log.info("Removed overflowed cache entry (size %d): %s", cache.size, url);
            }
        }

        function getLimit() {
            var usedTimes = [];
            for (var url of cache.keys()) {
                var value = cache.get(url);
                usedTimes.push(value.used);
            }
            usedTimes.sort(function (a, b) {
                return a - b;
            });
            return usedTimes[usedTimes.length - opts.maxsize];
        }
    }

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



