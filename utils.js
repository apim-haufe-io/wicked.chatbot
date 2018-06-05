'use strict';

const request = require('request');
const { debug, info, warn, error } = require('portal-env').Logger('portal-chatbot:utils');
const wicked = require('wicked-sdk');
const fs = require('fs');
const path = require('path');

const utils = function () { };

utils.getUtc = function () {
    return Math.floor((new Date()).getTime() / 1000);
};

utils.getJson = function (ob) {
    if (ob instanceof String || typeof ob === "string") {
        if (ob === "")
            return null;
        return JSON.parse(ob);
    }
    return ob;
};

utils.getText = function (ob) {
    if (ob instanceof String || typeof ob === "string")
        return ob;
    return JSON.stringify(ob, null, 2);
};

utils.getIndexBy = function (anArray, predicate) {
    for (let i = 0; i < anArray.length; ++i) {
        if (predicate(anArray[i]))
            return i;
    }
    return -1;
};

utils.apiGet = function (app, url, callback) {
    debug('apiGet() ' + url);
    wicked.apiGet(url, callback);
};

utils.apiPut = function (app, url, body, callback) {
    debug('apiPut() ' + url);
    wicked.apiPut(url, body, callback);
};

utils.apiDelete = function (app, url, callback) {
    debug('apiDelete() ' + url);
    wicked.apiDelete(url, callback);
};

utils._packageVersion = null;
utils.getVersion = function () {
    if (!utils._packageVersion) {
        const packageFile = path.join(__dirname, 'package.json');
        if (fs.existsSync(packageFile)) {
            try {
                const packageInfo = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
                if (packageInfo.version)
                    utils._packageVersion = packageInfo.version;
            } catch (ex) {
                console.error(ex);
            }
        }
        if (!utils._packageVersion) // something went wrong
            utils._packageVersion = "0.0.0";
    }
    return utils._packageVersion;
};

utils._gitLastCommit = null;
utils.getGitLastCommit = function () {
    if (!utils._gitLastCommit) {
        const lastCommitFile = path.join(__dirname, 'git_last_commit');
        if (fs.existsSync(lastCommitFile))
            utils._gitLastCommit = fs.readFileSync(lastCommitFile, 'utf8');
        else
            utils._gitLastCommit = '(no last git commit found - running locally?)';
    }
    return utils._gitLastCommit;
};

utils._gitBranch = null;
utils.getGitBranch = function () {
    if (!utils._gitBranch) {
        const gitBranchFile = path.join(__dirname, 'git_branch');
        if (fs.existsSync(gitBranchFile))
            utils._gitBranch = fs.readFileSync(gitBranchFile, 'utf8');
        else
            utils._gitBranch = '(unknown)';
    }
    return utils._gitBranch;
};

utils._buildDate = null;
utils.getBuildDate = function () {
    if (!utils._buildDate) {
        const buildDateFile = path.join(__dirname, 'build_date');
        if (fs.existsSync(buildDateFile))
            utils._buildDate = fs.readFileSync(buildDateFile, 'utf8');
        else
            utils._buildDate = '(unknown build date)';
    }
    return utils._buildDate;
};

module.exports = utils;