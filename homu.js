var request = require("request");

function checkHomuQueue(cb) {
    // First check if any buildbot builders report an ongoing build.
    retrieveBuildbotBuilders(function(builders) {
        var allIdle = true;
        for (var builder in data) {
            var builderData = data[builder];
            if ('currentBuilds' in builderData && builderData['currentBuilds'].length) {
                return;
            }
        }
        // Next see if homu thinks that any PRs are ready to be built.
        queueLength(function(numPending, numApproved) {
            if (numApproved) {
                cb(numApproved);
            }
        });
    })
}

function queueLength(cb) {
    retrieveHomuQueue(function(body) {
        var numPending = (body.match(/<td class="pending">/g) || []).length;
        var numApproved = (body.match(/<td class="approved">/g) || []).length;
        cb(numPending, numApproved);
    });
}

function retrieveHomuQueue(cb) {
    request("http://servo-master.servo.org:54856/queue/servo", function(err, response, body) {
        if (!err && response.statusCode >= 200 && response.statusCode < 300) {
            cb(body);
        }
    });
}

function retrieveBuildbotBuilders(cb) {
    request("http://build.servo.org/json/builders/", function(err, response, body) {
        if (!err && response.statusCode >= 200 && response.statusCode < 300) {
            cb(JSON.parse(body));
        }
    });
}

exports.checkHomuQueue = checkHomuQueue;
exports.queueLength = queueLength;
