let { choose, combine, reduce, percentage, whole_number } = require("../randomtext");

var opener = [
    "RED ALERT:",
    "Here's the deal:",
    "Well,",
    "What do you know?",
    "The usual:",
    "How odd -",
    "Surprise!",
    "fyi",
    "in case you missed it,",
    "you should probably be aware that",
    "unchanged -",
    "hard to complain:"
];

var platform = [
    'ARM32',
    'ARM64',
    'android',
    'windows',
    'mac',
    'linux64',
    'linux32',
    'cortex-m4',
    'haiku',
    'redox',
]

function builder() {
    return 'the ' + choose(platform) + ' builder';
}

var tech = [
    'AWS',
    'macstadium',
    'github',
    builder,
    'larsbors',
    'homu',
    'crates.io',
    'servo.org',
    'reviewable',
    'TravisCI',
    'appveyor',
    'buildbot',
    'irccloud',
    'bors',
    'cloudflare',
    'pypi',
    'hg.mozilla.org'
];

var problem = [
    "stopped responding",
    "can't be pinged since",
    "started installing a system upgrade",
    "had to be restarted",
    "no longer accepts SSH connections since",
    "stopped running tests",
    "is under a DDoS attack since",
    "ran out of disk space",
    "began renegotiating our contract",
    "locked me out",
    "enabled 2fa",
];

function duration() {
    var units = [
        "milliseconds",
        "seconds",
        "minutes",
        "hours",
        "days",
        "weeks",
        "months"
    ];
    return whole_number() + ' ' + choose(units);
}

var comparison = [
    "above",
    "below"
];

var patterns = [
    [tech, problem, duration, "ago"],
    ["no problems detected"],
    [tech, "is", "running", percentage, comparison, "capacity"],
    [tech, "is", "taking", whole_number, "times", "longer", "than", "usual"],
    ["only", whole_number, "interruptions", "for", tech, "so", "far"],
    [tech, "is", "under", "heavy", "load"],
    ["no", "issues", "with", tech, "in", duration],
    [tech, "was", "taken", "down", "for", "maintenance", duration, "ago"],
    ["switching", "to", tech, "was", "a", "good", "choice"],
    ["it", "has", "been", duration, "since", "the", "last", "incident"]
];

var ending = [
    "",
    ".",
    "...",
    "!",
    "!!",
    " :/",
    " :<",
    " :(",
    "; so far so good!",
];

function report() {
    var pattern = choose(patterns);
    var combined = combine(pattern);
    if (Math.random() > 0.5) {
        combined = choose(opener) + ' ' + combined;
    }
    return combined + choose(ending);
}

exports.report = report;
