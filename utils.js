var request = require('request');
var debug = require('debug')('portal-chatbot:utils');
var wicked = require('wicked-sdk');

var utils = function() { };

utils.getUtc = function () {
    return Math.floor((new Date()).getTime() / 1000);
};

utils.getJson = function(ob) {
    if (ob instanceof String || typeof ob === "string") {
        if (ob === "")
            return null;
        return JSON.parse(ob);
    }
    return ob;
};

utils.getText = function(ob) {
    if (ob instanceof String || typeof ob === "string")
        return ob;
    return JSON.stringify(ob, null, 2);
};

utils.getIndexBy = function(anArray, predicate) {
    for (var i=0; i<anArray.length; ++i) {
        if (predicate(anArray[i]))
            return i;
    }
    return -1;
};

utils.apiGet = function(app, url, callback) {
    debug('apiGet() ' + url);
    wicked.apiGet(url, callback);
};

utils.apiPut = function(app, url, body, callback) {
    debug('apiPut() ' + url);
    wicked.apiPut(url, body, callback);
};

utils.apiDelete = function(app, url, callback) {
    debug('apiDelete() ' + url);
    wicked.apiDelete(url, callback);
};

module.exports = utils;