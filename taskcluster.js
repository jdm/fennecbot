var request = require("request");

function retrieveJobs(project, cb) {
    request("https://treeherder.mozilla.org/api/project/" + project + "/jobs/?format=json&state=pending&state=running", function(err, response, body) {
        if (!err && response.statusCode >= 200 && response.statusCode < 300) {
            cb(JSON.parse(body));
        }
    });
}

function currentRunningJobs(cb) {
    retrieveJobs("servo-auto", function(data) {
        cb(data.results.length);
    });
}

exports.currentRunningJobs = currentRunningJobs;
