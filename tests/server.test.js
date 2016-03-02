var handlerWrapper = require("../server").handlerWrapper;
var sinon = require("sinon");
var assert = require("chai").assert;

describe("server", function() {
  var pings, say, actions, searchGithub, handler;

  beforeEach(function() {
    pings = {};
    say = [];
    actions = [];
    var bot = {
      nick: "testbot",
      say: function(to, message) { say.push({ to: to, message: message }); },
      actions: function(to, message) { actions.push({ to: to, message: message }); }
    };

    searchGithub = sinon.stub();
    handler = handlerWrapper(pings, bot, searchGithub);
  });

  describe("handler issue number", function() {
    it("should request issue when #<number> is detected", function() {
      searchGithub.callsArgWith(3, null, require("./data/issue-52-success.json"));

      handler("bob", "testbot", "test string #52");

      assert.equal(searchGithub.args[0][0], "/52");
      assert.equal(say[0].to, "testbot");
      assert.equal(say[0].message, "Issue #52: Add MacPorts instructions/required ports/workarounds - https://github.com/servo/servo/pull/52");
    });

    it("should request issue when #<number> is first in line", function() {
      searchGithub.callsArgWith(3, null, require("./data/issue-52-success.json"));

      handler("bob", "testbot", "#52 test");

      assert.equal(searchGithub.args[0][0], "/52");
      assert.equal(say[0].to, "testbot");
      assert.equal(say[0].message, "Issue #52: Add MacPorts instructions/required ports/workarounds - https://github.com/servo/servo/pull/52");
    });

    it("should ignore #52 when included in url", function() {
      handler("bob", "testbot", "http://test#52");

      assert.equal(searchGithub.called, false);
      assert.equal(say.length, 0);
    });
  });
});
