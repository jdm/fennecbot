var irc = require("irc"),
    https = require("https"),
    request = require("request"),
    notes = require("./notes"),
    config = require("./config");

if (module.parent) {
  return;
}

var bot = new irc.Client(config.server, config.botName, {
  channels: config.channels,
  port: config.port,
  secure: config.secure
});

var milestones = {
  'acid2': 4
};

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
  searchGithub(search, 'mozilla', 'servo', function(error, issues) {
    if (error) {
      console.log(error);
      return;
    }

    // Find a random bug from the array.
    var index = choose(issues);
    var issue = issues[index];
    console.log(bot.nick + " found issue " + issue.num);

    var message = from + ": Try working on issue #" + issue.number + " - " + issue.title + " - " + issue.html_url;
    bot.say(to, message);
  });
}

bot.addListener("message", function(from, to, message) {
  if (from == 'ghservo') {
    return;
  }

  // watch for:
  // issue 123
  // " #123" to avoid catching html anchors
  // "#123" at the start of a line
  var numbers_re = /(issue\s|\s#|^#)([\d]+)/g;
  var numbers;
  while ((numbers = numbers_re.exec(message)) !== null) {
    searchGithub("/" + numbers[2], 'mozilla', 'servo', function(error, issue) {
      if (error) {
        console.log(error);
        return;
      }
      var message = 'Issue #' + issue.number + ': ' + issue.title + ' - ' + issue.html_url;
      bot.say(to, message);
    });
  }

  // watch for github issue links to any repository
  var issues_re = /https:\/\/github\.com\/([\w\-]+)\/([\w\-]+)\/issues\/(\d+)/g;
  var issues;
  while ((issues = issues_re.exec(message)) !== null) {
    searchGithub("/" + issues[3], issues[1], issues[2], function(error, issue) {
      if (error) {
        console.log(error);
        return;
      }
      var message = 'Issue #' + issue.number + ': ' + issue.title + ' - ' + issue.html_url;
      bot.say(to, message);
    });
  }

  if (message.indexOf('w3.org/TR') > -1) {
    var allowed = ['PNG'];
    var found = false;
    for (var i = 0; i < allowed.length; i++) {
      found = found || (message.indexOf(allowed[i]) > -1);
    }
    if (!found) {
      bot.say(to, from + ": that's probably not the spec you want. Please read https://github.com/mozilla/servo/wiki/Relevant-spec-links");
      return;
    }
  }

  var angry_msgs = ["shut up crowbot",
                    "shut up, crowbot",
                    "crowbot: shut up",
                    "kicks crowbot"];
  if (angry_msgs.indexOf(message.toLowerCase()) > -1) {
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
  
  if (message.indexOf("acid2 bug") > -1) {
    findIssue(from, to, "?milestone=" + milestones['acid2'] + '&asignee=none');
    return;
  }

  if (message.indexOf("easy bug") > -1) {
    findIssue(from, to, "?labels=E-Easy");
    return;
  }

  if (message.indexOf("help") > -1) {
    bot.say(to, from + ": Try looking at our wiki: https://github.com/mozilla/servo/blob/master/CONTRIBUTING.md");
    return;
  }

  if (message.indexOf("notes") > -1) {
    var recentNotes = notes.recent(from, to);
    bot.say(to, recentNotes);
    return;
  }

  if (message.indexOf("build") > -1) {
    bot.say(to, from + ": Try looking at our readme: https://github.com/mozilla/servo/#prerequisites");
    return;
  }

  if (message.indexOf("source") > -1) {
    bot.say(to, from + ": https://github.com/jdm/fennecbot");
    return;
  }

  if (message.indexOf('botsnack') > -1) {
    var replies = ["/me beams", "yum!", ":)"];
    var reply = replies[choose(replies)];
    if (reply.indexOf('/me ') == 0) {
      bot.action(to, reply.substring(4));
    } else {
      bot.say(to, reply);
    }
    return;
  }
});
