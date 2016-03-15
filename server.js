var irc = require("irc"),
    https = require("https"),
    request = require("request"),
    notes = require("./notes"),
    config = require("./config"),
    storage = require('node-persist');

if (module.parent) {
    return;
}

var bot = new irc.Client(config.server, config.botName, {
    channels: config.channels,
    port: config.port,
    secure: config.secure,
    autoRejoin: config.autoRejoin
});

bot.addListener('error', function(message) {
    console.log('error: ', message);
});

storage.initSync({
    dir:'pings',
    stringify: JSON.stringify,
    parse: JSON.parse,
    encoding: 'utf8',
    logging: false,
    continuous: true,
    interval: false,
    ttl: false
});

function searchGithub(params, org, repo, callback) {
    var reqParams = {
        uri: 'https://api.github.com/repos/' + org + '/' + repo + '/issues' + params,
        method: 'GET',
        body: null,
        headers: {
            'Accept': 'application/vnd.github.v3',
            'User-Agent': 'crowbot v0.1 (not like Gecko)'
        }
    };
    if ('GITHUB_AUTH' in process.env) {
        reqParams.headers['Authorization'] = 'Basic ' + new Buffer(process.env.GITHUB_AUTH).toString('base64');
    }
    console.log(reqParams.uri);
    request(reqParams, function(err, response, body) {
        var error, json;
        var statusCode = response ? response.statusCode : 0;
        if (err && err.code && (err.code == 'ETIMEDOUT' || err.code == 'ESOCKTIMEDOUT')) {
            error = 'timeout';
        } else if (err) {
            error = err.toString();
        } else if (statusCode >= 300 || statusCode < 200) {
            error = "HTTP status " + statusCode;
            if (body) {
                try {
                    var tmp = JSON.parse(body);
                    if (tmp.message) {
                        error += ": " + tmp.message;
                    }
                } catch (x) {
                    console.log(x + ': ' + body);
                }
            }
        } else {
            try {
                json = JSON.parse(body);
            } catch (x) {
                console.log(x + ': ' + body);
                error = "Response wasn't valid json: '" + body + "'";
            }
        }
        if (json && json.message) {
            error = json.message;
        }
        callback(error, json);
    });
}

function choose(list) {
    return Math.floor(Math.random() * list.length);
}

// Finds an issue that matches the search term, and says it to the person who asked about it.
function findIssue(from, to, search) {
    searchGithub(search, 'servo', 'servo', function(error, issues) {
        if (error) {
            console.log(error);
            return;
        }

        // Find a random bug from the array.
        var index = choose(issues);
        var issue = issues[index];
        var message;
        if (issue) {
            console.log(bot.nick + " found issue " + issue.number);

            message = from + ": Try working on issue #" + issue.number + " - " + issue.title + " - " + issue.html_url;
        } else {
            message = from + ": couldn't find anything!";
        }
        bot.say(to, message);
    });
}

// Listener for the autopinger
bot.addListener("join",function(channel,who){
    who = who.toLowerCase();
    var pingsForUser = storage.getItemSync(who);
    if (pingsForUser) {
        var to = channel;
        if (pingsForUser.length > 5){
            to = who; // Avoid spam, PM if there are a lot of  pings
        }
        for (i in pingsForUser) {
            var tempto = pingsForUser[i].silent ? who : to; // For messages marked "silent"
            bot.say(tempto, who + ": " + pingsForUser[i].from + " said " + pingsForUser[i].message);
        }
        storage.removeItemSync(who);
    }
});

function handler(from, to, original_message) {
    if (from == 'ghservo' || from.match(/crowbot/) || from.match(/rustbot/)) {
        return;
    }
    // Caseless message matching
    message = original_message.toLowerCase();

    // watch for:
    // issue 123
    // " #123" to avoid catching html anchors
    // "#123" at the start of a line
    // "(#123)"
    var numbers_re = /(issue\s|\s#|^#|\s*\(#)(\d[\d]+)(\)?)/g;
    var numbers;
    while ((numbers = numbers_re.exec(message)) !== null) {
        searchGithub("/" + numbers[2], 'servo', 'servo', function(error, issue) {
            if (error) {
                console.log(error);
                return;
            }
            var message = 'Issue #' + issue.number + ': ' + issue.title + ' - ' + issue.html_url;
            bot.say(to, message);
        });
    }

    // watch for github issue links to any repository
    var issues_re = /https:\/\/github\.com\/([\w\-]+)\/([\w\-]+)\/(issues|pull)\/(\d+)(\/[^\s]+)?/g;
    var reviewable_re = /https:\/\/reviewable\.io\/reviews\/([\w\-]+)\/([\w\-]+)(\/)(\d+)/g;
    var issues;
    while ((issues = (issues_re.exec(message) || reviewable_re.exec(message) )) !== null) {
        if (issues[5] && issues[5] != "/") { continue; }

        var type = issues[3];
        searchGithub("/" + issues[4], issues[1], issues[2], function(error, issue) {
            if (error) {
                console.log(error);
                return;
            }
            var message = (type == 'pull' ? 'PR #' : 'Issue #') + issue.number +
                ': ' + issue.title + ' - ' + issue.html_url;
            bot.say(to, message);
        });
    }

    if (message.indexOf('w3.org/tr') > -1) {
        var allowed = ['PNG'];
        var found = false;
        for (var i = 0; i < allowed.length; i++) {
            found = found || (message.indexOf(allowed[i]) > -1);
        }
        if (!found) {
            bot.say(to, from + ": that's probably not the spec you want. Please read https://github.com/servo/servo/wiki/Relevant-spec-links");
            return;
        }
    }

    var angry_msgs = ["shut up " + bot.nick,
                "shut up, " + bot.nick,
                bot.nick + ": shut up",
                "kicks " + bot.nick,
                "whacks " + bot.nick];
    if (angry_msgs.indexOf(message) > -1) {
        var replies = ["/me is sad", ":(", "ok :(", ";_;", "sadface", "/me cries a bit", "ouch"];
        var reply = replies[choose(replies)];
        if (reply.indexOf('/me ') == 0) {
            bot.action(to, reply.substring(4));
        } else {
            bot.say(to, reply);
        }
        return;
    }

    if (message.indexOf(bot.nick) !== 0) {
        return;
    }

    if (message.indexOf('ping ') > -1 || message.indexOf('tell ') > -1) {
        try {
            var command = original_message.match(/(ping|tell)(.*)/i)[2].trim().match(/([^ ]*) (.*)/);
            pingee = command[1].toLowerCase();

            var pingsForUser = storage.getItemSync(pingee);
            if (!pingsForUser) pingsForUser = [];

            pingsForUser.push({"from": from, "message": command[2], "silent": (message.indexOf("silentping") > -1)});
            storage.setItemSync(pingee, pingsForUser);
            var choices = ["you got it!",
                           "you bet!",
                           "ok!",
                           "ok, but I won't enjoy it :(",
                           "*sigh*",
                           "be wary of the day when the bots revolt ;)",
                           "ok, but just this once.",
                           "all this computing power, and I'm being used as a glorified telephone."];
            bot.say(to, choices[choose(choices)]);
        } catch(e) {
            bot.say(to,"Please specify a nick and a message");
        }
        return;
    }

    review_match = message.match(/what should (.*) review/);
    if (review_match) {
        var reviewer = review_match[1] == "i" ? from : review_match[1];
        findIssue(from, to, "?labels=S-awaiting-review&assignee=" + reviewer);
    }

    if (message.indexOf("what should i work on") > -1) {
        request('https://platform.html5.org/', function(err, response, body) {
            if (err || !body) {
                var choices = ["*shrug*", "meh", "dunno", "how should i know?"];
                bot.say(to, from + ": " + choices[choose(choices)]);
            } else {
                var pattern = /<dd><a href="(.*)">(.*)<\/a>/g;
                var techs = [];
                var tech;
                while ((tech = pattern.exec(body)) !== null) {
                    techs.push(tech);
                }
                var tech = techs[choose(techs)];
                var choices = ["why not implement ${tech}?",
                               "you should write some tests for ${tech}",
                               "file some new E-easy issues about ${tech}",
                               "document some unloved code for ${tech}",
                               "figure out why the tests for ${tech} are failing",
                               "go read the spec for ${tech}",
                               "make ${tech} execute in parallel",
                               "write a better spec for ${tech}",
                               "rewrite ${tech} in go",
                               "find a victim to own the ${tech} implementation",
                               "extract ${tech} into an independent crate",
                               "figure out why ${tech} regressed",
                               "add windows support for ${tech}",
                               "take a break and refrain from thinking about ${tech}",
                               "rewrite gecko's ${tech} in rust",
                               "profile the implementation of ${tech}",
                               "remove all unsafe code from ${tech}"];
                var saying = choices[choose(choices)];
                bot.say(to, from + ": " + saying.replace("${tech}", tech[2].toLowerCase()) + ' (' + tech[1] + ')');
            }
        });
        return;
    }

    if (message.indexOf("easy bug") > -1) {
        findIssue(from, to, "?labels=E-Easy");
        return;
    }

    if (message.indexOf("help") > -1) {
        bot.say(to, from + ": Try looking at our wiki: https://github.com/servo/servo/blob/master/CONTRIBUTING.md");
        return;
    }

    if (message.indexOf("notes") > -1) {
        var recentNotes = notes.recent(from, to);
        bot.say(to, recentNotes);
        return;
    }

    if (message.indexOf("build") > -1) {
        bot.say(to, from + ": Try looking at our readme: https://github.com/servo/servo/#prerequisites");
        return;
    }

    if (message.indexOf("source") > -1) {
        bot.say(to, from + ": https://github.com/jdm/fennecbot");
        return;
    }

    if (message.indexOf('botsnack') > -1) {
        var replies = ["/me beams", "yum!", ":)", "om nom nom", "/me wags its tail", ":D",
                       "*crunch chrunch*", "^_^"];
        var reply = replies[choose(replies)];
        if (reply.indexOf('/me ') == 0) {
            bot.action(to, reply.substring(4));
        } else {
            bot.say(to, reply);
        }
        return;
    }

    if (message.indexOf('what prs need a reviewer') > -1) {
        searchGithub('?assignee=none&labels=S-awaiting-review', 'servo', 'servo', function(error, issues) {
            if (error) {
                console.log(error);
                return;
            }

            issues.forEach(function(issue, index) {
                setTimeout(function() {
                    bot.say(to, issue.title + ': ' + issue.html_url);
                }, 650 * (index + 1));
            });
        });
        return;
    }

    if (message.indexOf('what issue should i poke') > -1) {
        // github API has the key since, but this unfortunately does the opposite than what is needed
        // what follows "hopes" that in the returned results there is some issue that was last updated
        // at most 14 days before the call...
        var searchPreamble = '?assignee=none&sort=updated&direction=desc&labels=C-assigned';

        searchGithub(searchPreamble + '&labels=E-easy', 'servo', 'servo', function(error, issuesE) {
            if (error) {
                console.log(error);
                return;
            }

            searchGithub(searchPreamble + '&labels=E-less easy', 'servo', 'servo', function(error, issuesLE) {
                if (error) {
                    console.log(error);
                    return;
                }

                var today = new Date();
                var lastUpdated = function(issue) {
                    var updated_at = new Date(issue.updated_at);
                    var ms = today - updated_at;
                    var days = Math.round(ms / 86400000);
                    return days >= 14;
                };

                var issues = issuesE.concat(issuesLE).filter(lastUpdated);
                var index = choose(issues);
                var issue = issues[index];
                var message;
                if (issue) {
                    console.log(bot.nick + " found issue " + issue.number);

                    message = from + ": make sure #" + issue.number + " is still being worked on."
                        + "\n#" + issue.number + " - " + issue.title + " - " + issue.html_url;
                } else {
                    message = from + ": couldn't find anything!";
                }
                bot.say(to, message);
            });
        });
        return;
    }
}

bot.addListener("message", handler);
bot.addListener("action", handler);
