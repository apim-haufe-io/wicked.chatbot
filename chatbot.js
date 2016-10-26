var request = require('request');
var async = require('async');
var mustache = require('mustache');
var debug = require('debug')('portal-chatbot:chatbot');

var Messages = require('./messages.json');
var utils = require('./utils');

var chatbot = function () { };

chatbot.interestingEvents = {};
chatbot.chatbotTemplates = null;

chatbot.init = function (app, done) {
    debug('init()');
    const myUrl = app.get('my_url');

    async.parallel({
        registerWebhook: function (callback) {
            debug('Registering as listener.');
            putPayload = {
                id: 'chatbot',
                url: myUrl
            };
            utils.apiPut(app, 'webhooks/listeners/chatbot', putPayload, callback);
        },
        getGlobals: function (callback) {
            debug('Getting global settings...');
            utils.apiGet(app, 'globals', function (err, chatbotGlobals) {
                if (err)
                    return callback(err);
                debug('Retrieved global settings successfully.');
                return callback(null, chatbotGlobals);
            });
        },
        getTemplates: function (callback) {
            debug('Getting templates...');
            utils.apiGet(app, 'templates/chatbot', function (err, chatbotTemplates) {
                if (err)
                    return callback(err);
                debug('Retrieved templates successfully.');
                return callback(null, chatbotTemplates);
            });
        }
    }, function (err, results) {
        if (err)
            return done(err);

        app.chatbotGlobals = results.getGlobals;
        chatbot.chatbotTemplates = results.getTemplates;

        chatbot.initInterestingEvents(app.chatbotGlobals);

        return done(null);
    });
};

chatbot.deinit = function (app, done) {
    debug('deinit()');
    utils.apiDelete(app, 'webhooks/listeners/chatbot', done);
};

chatbot.initInterestingEvents = function (chatbotGlobals) {
    debug('initInterestingEvents()');
    if (!chatbotGlobals.chatbot ||
        !chatbotGlobals.chatbot.events) {
        return;
    }

    for (var message in Messages) {
        if (chatbotGlobals.chatbot.events[message]) {
            var thisMessage = Messages[message];
            var eventId = thisMessage.entity + '.' + thisMessage.action;
            var messageTemplate = chatbot.chatbotTemplates[message];
            if (!messageTemplate)
                throw new Error('The chatbot message template is missing for event "' + message + '".');
            chatbot.interestingEvents[eventId] = messageTemplate;
        }
    }
};

chatbot.isEventInteresting = function (event) {
    debug('isEventInteresting()');
    debug(event);
    var eventId = event.entity + '.' + event.action;
    return !!chatbot.interestingEvents[eventId];
};

chatbot.handleEvent = function (app, event, done) {
    debug('handleEvent()');
    debug(event);
    var eventId = event.entity + '.' + event.action;
    var messageTemplate = chatbot.interestingEvents[eventId];

    if (!event.data)
        return done(null);
    if (!event.data.userId)
        return done(null);

    buildViewModel(app, event, function (err, viewModel) {
        if (err)
            return done(err);

        var text = mustache.render(messageTemplate, viewModel);

        var hookUrls = app.chatbotGlobals.chatbot.hookUrls;
        async.each(hookUrls, function (hookUrl, callback) {
            // Post to the hook URL
            var payload = {
                username: app.chatbotGlobals.chatbot.username,
                icon_url: app.chatbotGlobals.chatbot.icon_url,
                text: text
            };

            request.post({
                url: hookUrl,
                json: true,
                body: payload
            }, function (chatbotErr, apiResponse, apiBody) {
                if (chatbotErr)
                    return callback(chatbotErr);
                if (apiResponse.statusCode > 299) {
                    debug('Posting to Chatbot failed: Status ' + apiResponse.statusCode);
                    debug(apiResponse);
                    debug(apiBody);
                    console.error(utils.getText(apiBody));
                }
                    
                return callback(null);
            });
        }, function(err, results) {
            if (err) {
                debug(err);
                console.error(err);
            }
            done(null);
        });
    });
};

function getPortalUrl(app) {
    return app.chatbotGlobals.network.schema + '://' +
        app.chatbotGlobals.network.portalHost;
}

function buildViewModel(app, event, callback) {
    debug('buildViewModel()');
    utils.apiGet(app, 'users/' + event.data.userId, function (err, userInfo) {
        if (err)
            return callback(err);

        var portalUrl = getPortalUrl(app);
        var applicationLink = null;
        if (event.data.applicationId)
            applicationLink = portalUrl + '/applications/' + event.data.applicationId;
        callback(null, {
            userId: event.data.userId,
            name: userInfo.name,
            email: userInfo.email,
            firstName: userInfo.firstName,
            lastName: userInfo.lastName,
            apiId: event.data.apiId,
            applicationId: event.data.applicationId,
            approvalsLink: portalUrl + '/admin/approvals',
            userLink: portalUrl + '/users/' + event.data.userId,
            applicationLink: applicationLink
        });
    });
}

module.exports = chatbot;