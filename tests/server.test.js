var handlerWrapper = require("../server").handlerWrapper;
var pingResponderWrapper = require("../server").pingResponderWrapper;
var sinon = require("sinon");
var assert = require("chai").assert;
var nock = require("nock");

describe("server", function() {
  var bot, pings, say, action, searchGithub, handler, sandbox, pingStorage, newsflash;

  beforeEach(function() {
    pings = {};
    pingStorage = {
      getItemSync: function(pingee) { return pings[pingee]; },
      setItemSync: function(pingee, pingsForUser) { pings[pingee] = pingsForUser; },
      removeItemSync: function(pingee) { delete pings[pingee]; }
    };
    say = [];
    action = [];
    var notes = {
      recent: function(from, to) { return "some link to notes"; }
    };
    var newsflash = {
      createRumour: function() { return "some rumour about Servo"; }
    };

    bot = {
      nick: "fredbot",
      say: function(to, message) { say.push({ to: to, message: message }); },
      action: function(to, message) { action.push({ to: to, message: message }); }
    };

    offsets = {
      "jdm": +5.5,
    };

    sandbox = sinon.sandbox.create();
    searchGithub = sinon.stub();
    handler = handlerWrapper(pings, bot, searchGithub, notes, pingStorage, newsflash, offsets);
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe("handler issue number", function() {
    it("should request issue when #<number> is detected", function() {
      searchGithub.callsArgWith(3, null, require("./data/issue-52-success.json"));

      handler("bob", "testbot", "test string #52");

      assert.equal(searchGithub.args[0][0], "/52");
      assert.equal(say[0].to, "testbot");
      assert.equal(say[0].message, "Issue #52: Add MacPorts instructions/required ports/workarounds - https://github.com/servo/servo/pull/52");
    });

    it("should request issue when #<number> is in brackets", function() {
      searchGithub.callsArgWith(3, null, require("./data/issue-52-success.json"));

      handler("bob", "testbot", "test string (#52)");

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

    it("should request multiple issues when multiple #<number> entries found", function() {
      searchGithub.withArgs("/52").callsArgWith(3, null, require("./data/issue-52-success.json"));
      searchGithub.withArgs("/34").callsArgWith(3, null, require("./data/issue-34-success.json"));

      handler("bob", "testbot", "#52 test #34");

      assert.equal(searchGithub.args[0][0], "/52");
      assert.equal(searchGithub.args[1][0], "/34");
      assert.equal(say[0].to, "testbot");
      assert.equal(say[0].message, "Issue #52: Add MacPorts instructions/required ports/workarounds - https://github.com/servo/servo/pull/52");
      assert.equal(say[1].to, "testbot");
      assert.equal(say[1].message, "Issue #34: make clean iloops cleaning mozjs - https://github.com/servo/servo/issues/34");
    });
  });

  describe("handler issue number with £", function() {
    it("should request issue when £<number> is detected", function() {
      searchGithub.callsArgWith(3, null, require("./data/issue-52-success.json"));

      handler("bob", "testbot", "test string £52");

      assert.equal(searchGithub.args[0][0], "/52");
      assert.equal(say[0].to, "testbot");
      assert.equal(say[0].message, "Issue #52: Add MacPorts instructions/required ports/workarounds - https://github.com/servo/servo/pull/52");
    });

    it("should request issue when £<number> is in brackets", function() {
      searchGithub.callsArgWith(3, null, require("./data/issue-52-success.json"));

      handler("bob", "testbot", "test string (£52)");

      assert.equal(searchGithub.args[0][0], "/52");
      assert.equal(say[0].to, "testbot");
      assert.equal(say[0].message, "Issue #52: Add MacPorts instructions/required ports/workarounds - https://github.com/servo/servo/pull/52");
    });

    it("should request issue when £<number> is first in line", function() {
      searchGithub.callsArgWith(3, null, require("./data/issue-52-success.json"));

      handler("bob", "testbot", "£52 test");

      assert.equal(searchGithub.args[0][0], "/52");
      assert.equal(say[0].to, "testbot");
      assert.equal(say[0].message, "Issue #52: Add MacPorts instructions/required ports/workarounds - https://github.com/servo/servo/pull/52");
    });

    it("should ignore £52 when included in url", function() {
      handler("bob", "testbot", "http://test£52");

      assert.equal(searchGithub.called, false);
      assert.equal(say.length, 0);
    });

    it("should request multiple issues when multiple £<number> entries found", function() {
      searchGithub.withArgs("/52").callsArgWith(3, null, require("./data/issue-52-success.json"));
      searchGithub.withArgs("/34").callsArgWith(3, null, require("./data/issue-34-success.json"));

      handler("bob", "testbot", "£52 test £34");

      assert.equal(searchGithub.args[0][0], "/52");
      assert.equal(searchGithub.args[1][0], "/34");
      assert.equal(say[0].to, "testbot");
      assert.equal(say[0].message, "Issue #52: Add MacPorts instructions/required ports/workarounds - https://github.com/servo/servo/pull/52");
      assert.equal(say[1].to, "testbot");
      assert.equal(say[1].message, "Issue #34: make clean iloops cleaning mozjs - https://github.com/servo/servo/issues/34");
    });

    it("should request multiple issues when multiple £<number> or #<number> entries found", function() {
      searchGithub.withArgs("/52").callsArgWith(3, null, require("./data/issue-52-success.json"));
      searchGithub.withArgs("/34").callsArgWith(3, null, require("./data/issue-34-success.json"));

      handler("bob", "testbot", "£52 test #34");

      assert.equal(searchGithub.args[0][0], "/52");
      assert.equal(searchGithub.args[1][0], "/34");
      assert.equal(say[0].to, "testbot");
      assert.equal(say[0].message, "Issue #52: Add MacPorts instructions/required ports/workarounds - https://github.com/servo/servo/pull/52");
      assert.equal(say[1].to, "testbot");
      assert.equal(say[1].message, "Issue #34: make clean iloops cleaning mozjs - https://github.com/servo/servo/issues/34");
    });
});

  describe("handler github links to any repository", function() {
    it("should handle a single github url", function() {
      searchGithub.withArgs("/37", "servo", "crowbot").callsArgWith(3, null, require("./data/issue-crowbot-37-success.json"));

      handler("bob", "testbot", "https://github.com/servo/crowbot/issues/37");

      assert.equal(searchGithub.args[0][0], "/37");
      assert.equal(searchGithub.args[0][1], "servo");
      assert.equal(searchGithub.args[0][2], "crowbot");

      assert.equal(say[0].to, "testbot");
      assert.equal(say[0].message, "Issue #37: Make crowbot testable - https://github.com/servo/crowbot/issues/37");
    });

    it("should ignore a github url with stuff at the end", function() {
      searchGithub.withArgs("/37", "servo", "crowbot").callsArgWith(3, null, require("./data/issue-crowbot-37-success.json"));

      handler("bob", "testbot", "Savago: I'm talking about https://github.com/servo/servo/pull/5366/files#diff-90a6391c1c7c20ffbfca3665f13cd657R490");

      assert.equal(say.length, 0);
    });
    
    it("should handle a single reviewable url", function() {
      searchGithub.withArgs("/37", "servo", "crowbot").callsArgWith(3, null, require("./data/issue-crowbot-37-success.json"));

      handler("bob", "testbot", "https://reviewable.io/reviews/servo/crowbot/37");

      assert.equal(searchGithub.args[0][0], "/37");
      assert.equal(searchGithub.args[0][1], "servo");
      assert.equal(searchGithub.args[0][2], "crowbot");

      assert.equal(say[0].to, "testbot");
      assert.equal(say[0].message, "Issue #37: Make crowbot testable - https://github.com/servo/crowbot/issues/37");
    });

    it("should handle a single github pull request url", function() {
      searchGithub.withArgs("/41", "servo", "crowbot").callsArgWith(3, null, require("./data/pull-crowbot-41-success.json"));

      handler("bob", "testbot", "https://github.com/servo/crowbot/pull/41");

      assert.equal(searchGithub.args[0][0], "/41");
      assert.equal(searchGithub.args[0][1], "servo");
      assert.equal(searchGithub.args[0][2], "crowbot");

      assert.equal(say[0].to, "testbot");
      assert.equal(say[0].message, "PR #41: Add basic tests - https://github.com/servo/crowbot/pull/41");
    });

    it("should handle a multiple github urls", function() {
      searchGithub.withArgs("/52", "servo", "servo").callsArgWith(3, null, require("./data/issue-52-success.json"));
      searchGithub.withArgs("/37", "servo", "crowbot").callsArgWith(3, null, require("./data/issue-crowbot-37-success.json"));

      handler("bob", "testbot", "https://github.com/servo/servo/issues/52 https://github.com/servo/crowbot/issues/37");

      assert.equal(searchGithub.args[0][0], "/52");
      assert.equal(searchGithub.args[0][1], "servo");
      assert.equal(searchGithub.args[0][2], "servo");

      assert.equal(searchGithub.args[1][0], "/37");
      assert.equal(searchGithub.args[1][1], "servo");
      assert.equal(searchGithub.args[1][2], "crowbot");

      assert.equal(say[0].to, "testbot");
      assert.equal(say[0].message, "Issue #52: Add MacPorts instructions/required ports/workarounds - https://github.com/servo/servo/pull/52");
      assert.equal(say[1].to, "testbot");
      assert.equal(say[1].message, "Issue #37: Make crowbot testable - https://github.com/servo/crowbot/issues/37");
    });
  });

  describe("handler should correct spec links", function() {
    //TODO understand what this is checking
  });

  describe("angry messages", function() {
    //These tests will unfortunately break if messages in the angry array change
    it("should respond to shut up with sadness", function() {
      sandbox.stub(Math, "random").returns(0.1);

      handler("bob", "testbot", "shut up fredbot");

      assert.equal(action[0].to, "testbot");
      assert.equal(action[0].message, "is sad");
    });

    it("should respond to shut up, with sadness", function() {
      sandbox.stub(Math, "random").returns(0.1);

      handler("bob", "testbot", "shut up, fredbot");

      assert.equal(action[0].to, "testbot");
      assert.equal(action[0].message, "is sad");
    });

    it("should respond to bot: shut up with sadness", function() {
      sandbox.stub(Math, "random").returns(0.1);

      handler("bob", "testbot", "fredbot: shut up");

      assert.equal(action[0].to, "testbot");
      assert.equal(action[0].message, "is sad");
    });

    it("should respond to kicks with ouch", function() {
      sandbox.stub(Math, "random").returns(0.99);

      handler("bob", "testbot", "kicks fredbot");

      assert.equal(say[0].to, "testbot");
      assert.equal(say[0].message, "ouch");
    });

    it("should respond to whacks with ouch", function() {
      sandbox.stub(Math, "random").returns(0.99);

      handler("bob", "testbot", "whacks fredbot");

      assert.equal(say[0].to, "testbot");
      assert.equal(say[0].message, "ouch");
    });

    it("should respond to smacks with ouch", function() {
      sandbox.stub(Math, "random").returns(0.99);

      handler("bob", "testbot", "smacks fredbot");

      assert.equal(say[0].to, "testbot");
      assert.equal(say[0].message, "ouch");
    });

    it("should not respond to whacks when directed at someone else", function() {
      sandbox.stub(Math, "random").returns(0.99);

      handler("bob", "testbot", "whacks bob");

      assert.equal(say.length, 0);
    });

    it("should fire action when message contains /me", function() {
      sandbox.stub(Math, "random").returns(0.1);

      handler("bob", "testbot", "whacks fredbot");

      assert.equal(say.length, 0);
      assert.equal(action.length, 1);
    });
  });

  describe("no bot nick", function() {
    it("should do nothing if doesn't match url checks", function() {
      handler("bob", "testbot", "super exciting message");

      assert.equal(say.length, 0);
      assert.equal(action.length, 0);

    });
  });

  describe("ping messages", function() {
    it("should add pingee to ping list and send remark", function() {
      sandbox.stub(Math, "random").returns(0.1);

      handler("bob", "testbot", "fredbot: ping mark a message");

      assert.equal(say[0].to, "testbot");
      assert.equal(say[0].message, "you got it!");

      var ping = pings['mark'][0];
      assert.equal(ping.from, 'bob');
      assert.equal(ping.message, 'a message');
      assert.equal(ping.silent, false);
    });

    it("should append pingee to ping list when one already exists", function() {
      sandbox.stub(Math, "random").returns(0.1);

      pings['mark'] = [ { from: 'old', message: 'yep', silent: false }];

      handler("bob", "testbot", "fredbot: ping mark a message");

      assert.equal(say[0].to, "testbot");
      assert.equal(say[0].message, "you got it!");

      var ping = pings['mark'][1];
      assert.equal(ping.from, 'bob');
      assert.equal(ping.message, 'a message');
      assert.equal(ping.silent, false);
    });

    it("should add pingee to ping list and send remark with tell alias", function() {
      sandbox.stub(Math, "random").returns(0.1);

      handler("bob", "testbot", "fredbot: tell mark a message");

      assert.equal(say[0].to, "testbot");
      assert.equal(say[0].message, "you got it!");

      var ping = pings['mark'][0];
      assert.equal(ping.from, 'bob');
      assert.equal(ping.message, 'a message');
      assert.equal(ping.silent, false);
    });

    it("should add pingee to ping list and send remark with silent", function() {
      sandbox.stub(Math, "random").returns(0.1);

      handler("bob", "testbot", "fredbot: silentping mark a message");

      assert.equal(say[0].to, "testbot");
      assert.equal(say[0].message, "you got it!");

      var ping = pings['mark'][0];
      assert.equal(ping.from, 'bob');
      assert.equal(ping.message, 'a message');
      assert.equal(ping.silent, true);
    });

    it("should refuse ping when missing the message", function() {
      sandbox.stub(Math, "random").returns(0.1);

      handler("bob", "testbot", "fredbot: ping mark");

      assert.equal(say[0].to, "testbot");
      assert.equal(say[0].message, "Please specify a nick and a message");
    });
  });

  describe("should review", function() {
    it("should return an issue to review", function() {
      sandbox.stub(Math, "random").returns(0.1);
      searchGithub.callsArgWith(3, null, require("./data/reviews-jdm.json"));

      handler("jdm", "testbot", "fredbot: what should I review");

      assert.equal(searchGithub.args[0][0], "?labels=S-awaiting-review&assignee=jdm");
      assert.equal(searchGithub.args[0][1], "servo");

      assert.equal(say[0].to, "testbot");
      assert.equal(say[0].message, "jdm: Try working on issue #9870 - Can\'t click on Twitter links - https://github.com/servo/servo/issues/9870");
    });

    it("should print message when no issues to review", function() {
      sandbox.stub(Math, "random").returns(0.1);
      searchGithub.callsArgWith(3, null, require("./data/reviews-jdm-none.json"));

      handler("jdm", "testbot", "fredbot: what should I review");

      assert.equal(searchGithub.args[0][0], "?labels=S-awaiting-review&assignee=jdm");
      assert.equal(searchGithub.args[0][1], "servo");

      assert.equal(say[0].to, "testbot");
      assert.equal(say[0].message, "jdm: couldn't find anything!");
    });

    it("should say nothing when github api errors", function() {
      sandbox.stub(Math, "random").returns(0.1);
      searchGithub.callsArgWith(3, new Error(), null);

      handler("jdm", "testbot", "fredbot: what should I review");

      assert.equal(searchGithub.args[0][0], "?labels=S-awaiting-review&assignee=jdm");
      assert.equal(searchGithub.args[0][1], "servo");

      assert.equal(say.length, 0);
    });
  });

  describe("should work on", function() {
    it("should return a tech to work on", function(done) {
      sandbox.stub(Math, "random").returns(0.1);
      nock('https://platform.html5.org')
        .get('/')
        .replyWithFile(200, __dirname + '/data/platform.html5.org');

      handler("jdm", "testbot", "fredbot: what should I work on");

      //this isn't the best idea, but it'll do for now.
      setTimeout(function() {
        assert.equal(say[0].to, "testbot");
        assert.equal(say[0].message, "jdm: you should write some tests for compositing and blending (https://drafts.fxtf.org/compositing/)");
        done();
      }, 100);
    });

    it("should return shrug when request fails", function(done) {
      sandbox.stub(Math, "random").returns(0.1);
      nock('https://platform.html5.org')
        .get('/')
        .replyWithError('oh no!');

      handler("jdm", "testbot", "fredbot: what should I work on");

      //this isn't the best idea, but it'll do for now.
      setTimeout(function() {
        assert.equal(say[0].to, "testbot");
        assert.equal(say[0].message, "jdm: *shrug*");
        done();
      }, 100);
    });
  });

  describe("finding an easy bug", function() {
    it("should return an easy bug", function() {
      sandbox.stub(Math, "random").returns(0.1);
      searchGithub.callsArgWith(3, null, require("./data/easy-bugs.json"));

      handler("jdm", "testbot", "fredbot: easy bug");

      assert.equal(searchGithub.args[0][0], "?labels=E-Easy");
      assert.equal(searchGithub.args[0][1], "servo");

      assert.equal(say[0].to, "testbot");
      assert.equal(say[0].message, "jdm: Try working on issue #9995 - test_ref() got an unexpected keyword argument \'kind\'.Fixes #9986 - https://github.com/servo/servo/pull/9995");
    });

    it("should print message when no easy bugs", function() {
      sandbox.stub(Math, "random").returns(0.1);
      searchGithub.callsArgWith(3, null, []);

      handler("jdm", "testbot", "fredbot: easy bug");

      assert.equal(say[0].to, "testbot");
      assert.equal(say[0].message, "jdm: couldn't find anything!");
    });
  });

  describe("asking for help", function() {
    it("should print the wiki url for help", function() {
      handler("jdm", "testbot", "fredbot: help");

      assert.equal(say[0].to, "testbot");
      assert.equal(say[0].message, "jdm: Try looking at our wiki: https://github.com/servo/servo/blob/master/CONTRIBUTING.md");
    });
  });

  describe("notes", function() {
    it("should return notes from notes recent", function() {
      handler("jdm", "testbot", "fredbot: notes");

      assert.equal(say[0].to, "testbot");
      assert.equal(say[0].message, "some link to notes");
    });
  });

  describe("rumour", function() {
    it("should return a random rumour", function() {
      handler("jdm", "testbot", "fredbot: what's new?");

      assert.equal(say[0].to, "testbot");
      assert.notEqual(say[0].message.indexOf('Servo'), -1);
    });
  });

  describe("build", function() {
    it("should return build readme link", function() {
      handler("jdm", "testbot", "fredbot: build");

      assert.equal(say[0].to, "testbot");
      assert.equal(say[0].message, "jdm: Try looking at our readme: https://github.com/servo/servo/#prerequisites");
    });
  });

  describe("source", function() {
    it("should return source link", function() {
      handler("jdm", "testbot", "fredbot: source");

      assert.equal(say[0].to, "testbot");
      assert.equal(say[0].message, "jdm: https://github.com/jdm/fennecbot");
    });
  });

  describe("botsnack", function() {
    it("should set action if contains /me", function() {
      sandbox.stub(Math, "random").returns(0.1);

      handler("jdm", "testbot", "fredbot: botsnack");

      assert.equal(action[0].to, "testbot");
      assert.equal(action[0].message, "beams");
    });

    it("should set say if doesnt contains /me", function() {
      sandbox.stub(Math, "random").returns(0.9);

      handler("jdm", "testbot", "fredbot: botsnack");

      assert.equal(say[0].to, "testbot");
      assert.equal(say[0].message, "^_^");
    });
  });

  describe("find pull requests needing a reviewer", function() {
    var clock;

    beforeEach(function() {
      clock = sinon.useFakeTimers();
    });

    afterEach(function() {
      clock.restore();
    });

    it("should return a pull request requiring review", function() {
      searchGithub.callsArgWith(3, null, require("./data/pull-require-review.json"));

      handler("jdm", "testbot", "fredbot: what prs need a reviewer");

      assert.equal(searchGithub.args[0][0], "?assignee=none&labels=S-awaiting-review");
      assert.equal(searchGithub.args[0][1], "servo");

      clock.tick(651);

      assert.equal(say.length, 1);
      assert.equal(say[0].to, "testbot");
      assert.equal(say[0].message, "Implement Document#elementsFromPoint: https://github.com/servo/servo/pull/10034");

      clock.tick(651);
      assert.equal(say.length, 2);
      assert.equal(say[1].to, "testbot");
      assert.equal(say[1].message, "Update WebSocket blocked ports to match the Fetch spec: https://github.com/servo/servo/pull/10014");

      clock.tick(651);
      assert.equal(say.length, 2);
    });

    it("should say nothing when there is an error", function() {
      searchGithub.callsArgWith(3, new Error(), require("./data/pull-require-review.json"));

      handler("jdm", "testbot", "fredbot: what prs need a reviewer");

      assert.equal(say.length, 0);
    });
  });

  describe("what issue should I poke", function() {
    it("should find an easy-ish issue to poke", function() {
      var easyBugs = require("./data/easy-bugs.json");
      easyBugs.forEach(function(easyBug) {
        easyBug.updated_at = new Date(+new Date - 12096e5);
      });

      sandbox.stub(Math, "random").returns(0.1);
      searchGithub.callsArgWith(3, null, easyBugs);

      handler("jdm", "testbot", "fredbot: what issue should I poke");

      var preamble = "?assignee=none&sort=updated&direction=desc&labels=C-assigned";
      assert.equal(searchGithub.args[0][0], preamble + "&labels=E-easy");
      assert.equal(searchGithub.args[0][1], "servo");

      assert.equal(say[0].to, "testbot");
      assert.equal(say[0].message, "jdm: make sure #9995 is still being worked on.\n#9995 - test_ref() got an unexpected keyword argument \'kind\'.Fixes #9986 - https://github.com/servo/servo/pull/9995");
    });

    it("should say if no issue is found", function() {
      var easyBugs = require("./data/easy-bugs.json");
      easyBugs.forEach(function(easyBug) {
        easyBug.updated_at = new Date(+new Date + 12096e5);
      });

      sandbox.stub(Math, "random").returns(0.1);
      searchGithub.callsArgWith(3, null, easyBugs);

      handler("jdm", "testbot", "fredbot: what issue should I poke");

      var preamble = "?assignee=none&sort=updated&direction=desc&labels=C-assigned";
      assert.equal(searchGithub.args[0][0], preamble + "&labels=E-easy");
      assert.equal(searchGithub.args[0][1], "servo");

      assert.equal(say[0].to, "testbot");
      assert.equal(say[0].message, "jdm: couldn't find anything!");
    });

    it("should choose from merged arrays", function() {
      var easyIshBugs = require("./data/easy-ish-bugs.json");
      easyIshBugs.forEach(function(easyIshBug) {
        easyIshBug.updated_at = new Date(+new Date - 12096e5);
      });
      var easyBugs = require("./data/easy-bugs.json");
      easyBugs.forEach(function(easyBug) {
        easyBug.updated_at = new Date(+new Date - 12096e5);
      });

      sandbox.stub(Math, "random").returns(0.99);
      searchGithub.onFirstCall().callsArgWith(3, null, easyBugs)
        .onSecondCall().callsArgWith(3, null, easyIshBugs);

      handler("jdm", "testbot", "fredbot: what issue should I poke");

      assert.equal(say[0].to, "testbot");
      assert.equal(say[0].message, "jdm: make sure #9994 is still being worked on.\n#9994 - Implement HTMLTextArea.setSelectionRange - https://github.com/servo/servo/issues/9994");
    });
  });

  describe("ping on join", function() {
    var pingResponder;

    beforeEach(function() {
      pingResponder = pingResponderWrapper(pings, bot, pingStorage);
    });

    it("should ping if in pings list", function() {
      pings["mark"] = [ { from: "old", message: "yep", silent: false }];

      pingResponder("testbot", "mark");

      assert.equal(say[0].to, "testbot");
      assert.equal(say[0].message, "mark: old said yep");
    });

    it("should ping if in pings list multiple times", function() {
      pings["mark"] = [
        { from: "old", message: "yep", silent: false },
        { from: "trevor", message: "woop", silent: false }
      ];

      pingResponder("testbot", "mark");

      assert.equal(say[0].to, "testbot");
      assert.equal(say[0].message, "mark: old said yep");
      assert.equal(say[1].to, "testbot");
      assert.equal(say[1].message, "mark: trevor said woop");
    });

    it("should say nothing if not in the list", function() {
      pings["mark"] = [
        { from: "old", message: "yep", silent: false },
        { from: "trevor", message: "woop", silent: false }
      ];

      pingResponder("testbot", "tom");

      assert.equal(say.length, 0);
    });

    it("should send a private message if lots of mentions", function() {
      pings["mark"] = [
        { from: "old", message: "yep", silent: false },
        { from: "old", message: "yep", silent: false },
        { from: "old", message: "yep", silent: false },
        { from: "old", message: "yep", silent: false },
        { from: "old", message: "yep", silent: false },
        { from: "trevor", message: "woop", silent: false }
      ];

      pingResponder("testbot", "mark");

      assert.equal(say[0].to, "mark");
      assert.equal(say[0].message, "mark: old said yep");
      assert.equal(say.length, 6);
      assert.equal(pings["mark"], undefined);
    });

  });
});
