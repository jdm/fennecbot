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

function searchGithub(params, callback) {
  var reqParams = {
    uri: 'https://api.github.com/repos/mozilla/servo/issues' + params,
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
  searchGithub(search, function(error, issues) {
    if (error) {
      console.log(error);
      return;
    }

    // Find a random bug from the array.
    var index = choose(issues);
    var issue = issues[index];
    console.log(bot.nick + " found issue " + issue.num);

    var message = from + ": Try working on issue #" + issue.number + " - " + issue.title + " " + issue.html_url;
    bot.say(to, message);
  });
}

bot.addListener("message", function(from, to, message) {
  var numbers = /#([\d]+)/.exec(message);
  if (numbers) {
    searchGithub("/" + numbers[1], function(error, issue) {
      if (error) {
        console.log(error);
        return;
      }
      var message = 'Issue #' + issue.number + ': ' + issue.title + ' - ' + issue.html_url;
      bot.say(to, message);
    });
  }

  if (message.indexOf('w3.org') > -1 &&
      message.indexOf('CSS21') == -1 &&
      message.indexOf('csswg') == -1) {
    bot.say(to, from + ": that's probably not the spec you want. Please read https://github.com/mozilla/servo/wiki/Relevant-spec-links .");
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
