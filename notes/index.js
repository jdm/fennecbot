var MEETINGDAY = 1; //Represents day of week of meetings

function getRecent(from, to) {

  var path = getPath();
  var message = from + ": Latest meeting notes: https://github.com/mozilla/servo/wiki/" + path;
  return message;
}

// Get the URI segment for the link
function getPath() {
  var prev = new Date();
  while (prev.getDay() !== MEETINGDAY) { //Loop until prev is the day of meetings
    prev = getPrevDay(prev);
  }
  return 'Meeting-' + prev.getFullYear() + '-' + getDate(prev.getMonth() + 1) + '-' + getDate(prev.getDate());
}

// Formats the date to prefix single-digit dates with a "0"
function getDate(num) {
  if (num < 10) {
    return  "0" + num;
  }
  return num;
}

// Properly formats the date to be an object (instead of the UTC string of numbers)
function getPrevDay(date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() - 1,
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds()
    );
}

// TODO
//Helper function to check if a link actually exists
function testLink() {
  var options = {
    hostname: 'github.com',
    port: 443,
    path: '/mozilla/servo/wiki/',
    method: 'GET'
  };

  var req = https.get(options, function(res) {
    console.log("statusCode: ", res.statusCode);
    console.log("headers: ", res.headers);

    res.on('data', function(chunk) {
      var message = from + ": Latest meeting notes: https://github.com" + path;
      bot.say(to, message);
    });
  });
  req.end();

  req.on('error', function(e) {
    console.error(e);
  });
}

exports.recent = function(from, to) {
  return getRecent(from, to);
};
