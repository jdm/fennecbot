var irc = require("irc"),
    https = require("https"),
    request = require("request"),
    XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
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
var pings={};

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

function searchCritic(from, to, review_num) {
  var oReq = new XMLHttpRequest();
  var uri = 'https://critic.hoppipolla.co.uk/r/' + review_num;
  console.log(uri);

  var pull_url_num = /'(https:\/\/github.com\/servo\/servo\/pull\/([\d]+))'/g;
  oReq.onload = function () {
  console.log(this.responseText);

  text = this.responseText;
  while((pull_url = pull_url_num.exec(text)) !== null) {
        console.log(pull_url[2]);

   var message;
   searchGithub("/" + pull_url[2], 'servo', 'servo', function(error, issue) {
    if (error) {
      console.log(error);
      return;
    }
    message = 'Issue #' + issue.number + ': ' + issue.title + ' - ' + issue.html_url + " , " + uri;
    bot.say(to, message);
    });
  }
}

  oReq.open("get", uri, true);
  oReq.send();
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
    console.log(bot.nick + " found issue " + issue.num);

    var message = from + ": Try working on issue #" + issue.number + " - " + issue.title + " - " + issue.html_url;
    bot.say(to, message);
  });
}

// Listener for the autopinger
bot.addListener("join",function(channel,who){
  who = who.toLowerCase();
  if (pings[who]) {
   var to = channel;
   if (pings[who].length > 5){
     to = who; // Avoid spam, PM if there are a lot of  pings
   }
   for (i in pings[who]) {
    var tempto = pings[who][i].silent ? who : to; // For messages marked "silent"
    bot.say(tempto, who + ": " + pings[who][i].from + " said " + pings[who][i].message)
   }
   delete pings[who];
  }
});

bot.addListener("message", function(from, to, message) {
  if (from == 'ghservo') {
    return;
  }

  // watch for:
  // issue 123
  // " #123" to avoid catching html anchors
  // "#123" at the start of a line
  var numbers_re = /(issue|[^r]\s#|^#)([\d]+)/g;
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

  var review_num = /((r|re|review)\s#?)([\d]+)/g;
  var review;
  while((review = review_num.exec(message)) !== null) {

   searchCritic(from, to, review[3]);
  }


  var not_crit = /https:\/\/critic.hoppipolla.co.uk\/r\/([\d]+)/g;
  var crit_num;

  while((crit_num = not_crit.exec(message)) !== null) {
    console.log(crit_num);
    searchCritic(from, to, crit_num[1]);
  }

  // watch for github issue links to any repository
  var issues_re = /https:\/\/github\.com\/([\w\-]+)\/([\w\-]+)\/(issues|pull)\/(\d+)/g;
  var issues;
  while ((issues = issues_re.exec(message)) !== null) {
    searchGithub("/" + issues[4], issues[1], issues[2], function(error, issue) {
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
      bot.say(to, from + ": that's probably not the spec you want. Please read https://github.com/servo/servo/wiki/Relevant-spec-links");
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
    var replies = ["/me beams", "yum!", ":)"];
    var reply = replies[choose(replies)];
    if (reply.indexOf('/me ') == 0) {
      bot.action(to, reply.substring(4));
    } else {
      bot.say(to, reply);
    }
    return;
  }
  if (message.indexOf('ping ') > -1 || message.indexOf('tell ') > -1) {
    try {
      var command = message.match(/(ping|tell)(.*)/)[2].trim().match(/([^ ]*) (.*)/);
      pingee = command[1].toLowerCase();
      if (!pings[pingee]) {
        pings[pingee] = [];
      }
      pings[pingee].push({"from": from, "message": command[2], "silent": (message.indexOf("silentping") > -1)});
    } catch(e) {
      bot.say(to,"Please specify a nick and a message")
    }
    return;
  }
});
