"use strict";

var buildURL = require("./../helpers/buildURL");
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

function jsonp(opts) {
  var prefix = opts.prefix || "__jp";

  var callbackName = opts.callback || "callback";

  // use the callback name that was passed if one was provided.
  // otherwise generate a unique name by incrementing our counter.
  var id = opts.name || prefix + count++;

  var timeout = opts.timeout || 60000;
  var cacheFlag = opts.cache || false;
  var enc = encodeURIComponent;
  var target = document.getElementsByTagName("script")[0] || document.head;
  var script;
  var timer;

  function cleanup() {
    if (script.parentNode) script.parentNode.removeChild(script);
    window[id] = noop;
    if (timer) clearTimeout(timer);
  }

  if (!opts.url) {
    throw new TypeError("url is null or not defined");
  }

  return new Promise(function (resolve, reject) {
    try {
      if (timeout) {
        timer = setTimeout(function () {
          cleanup();
          reject(new Error("Request timed out"));
        }, timeout);
      }

      window[id] = function (data) {
        cleanup();

        //Throws a `Cancel` if cancellation has been requested.
        if (opts.cancelToken) {
          opts.cancelToken.throwIfRequested();
        }

        resolve(data);
      };

      // add params
      opts.url = buildURL(opts.url, opts.params, opts.paramsSerializer);
      // add callback
      opts.url +=
        (opts.url.indexOf("?") === -1 ? "?" : "&") +
        callbackName +
        "=" +
        enc(id);
      // cache
      !cacheFlag && (opts.url += "&_=" + new Date().getTime());

      // create script
      script = document.createElement("script");
      script.src = opts.url;
      target.parentNode.insertBefore(script, target);
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = jsonp;
