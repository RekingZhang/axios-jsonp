var buildURL = require('./../helpers/buildURL');
var utils = require('../utils');
/**
 * Callback index.
 */

var count = 0;

/**
 * Noop function.
 */

function noop() {}

/**
 * JSONP handler
 *
 * Options:
 *  - param {String} qs parameter (`callback`)
 *  - prefix {String} qs parameter (`__jp`)
 *  - name {String} qs parameter (`prefix` + incr)
 *  - timeout {Number} how long after a timeout error is emitted (`60000`)
 *
 * @param {String} url
 * @param {Object|Function} optional options / callback
 */

function jsonp(url, opts) {
    if (utils.isObject(url)) {
        opts = url;
    } else {
        opts = utils.merge(opts || {}, {
            url: url
        });
    }

    var prefix = opts.prefix || '__jp';

    // use the callback name that was passed if one was provided.
    // otherwise generate a unique name by incrementing our counter.
    var id = opts.name || (prefix + (count++));

    var timeout = null != opts.timeout ? opts.timeout : 60000;
    var enc = encodeURIComponent;
    var target = document.getElementsByTagName('script')[0] || document.head;
    var script;
    var timer;

    if (!opts.url) {
        throw new TypeError('url is null or not defined');
    }
    return new Promise(function(resolve, reject) {
        try {
            if (timeout) {
                timer = setTimeout(function() {
                    cleanup();
                }, timeout);
            }

            function cleanup() {
                if (script.parentNode) script.parentNode.removeChild(script);
                window[id] = noop;
                if (timer) clearTimeout(timer);
            }

            window[id] = function(data) {
                cleanup();
                resolve(data);
            };

            // add qs component
            opts.url = buildURL(opts.url, opts.params, opts.paramsSerializer) + '&callback=' + enc(id);
            opts.url = opts.url.replace('?&', '?');
            // create script
            script = document.createElement('script');
            script.src = opts.url;
            target.parentNode.insertBefore(script, target);
        } catch (e) {
            reject(e);
        }
    });
}

module.exports = jsonp;
