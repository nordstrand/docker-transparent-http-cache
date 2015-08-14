var path = require('path'),
  fs = require('fs'),
  crypto = require('crypto'),
  mkdirp = require('mkdirp');
var MemoryStream = require('memorystream');

function Cache(log) {
    this.cache = new Map();

    this.read = function (key) {
        var cacheEntry = this.cache.get(key);

        if (cacheEntry) {
            cacheEntry.dataAsStream = new MemoryStream(cacheEntry.data);
        }

        return cacheEntry;
    };


    this.write = function (key, res) {
        var stream = MemoryStream(null, {readable: false});

        stream.on('finish', (function () {
            this.cache.set(key, {
                data: stream.toBuffer(),
                contenttype: res.headers['content-type'],
                etag: res.headers['etag'],
                headers: res.headers
            });
            log.info("Fetch finished and cache (size %d) updated: %s", this.cache.size, key);
        }).bind(this));

        return stream;
    };
}

Cache.NOT_FOUND = 0;
Cache.EXPIRED   = 2;
Cache.FRESH     = 4;

module.exports = Cache;
