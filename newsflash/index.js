function choose(list) {
  return list[Math.floor(Math.random() * list.length)];
}

var opener = [
    "BREAKING NEWS:",
    "i heard that",
    "I saw on /r/programming that",
    "someone on HN claimed",
    "the word on the street is that",
    "The results are in:",
    "oh cool,",
    "oh dear,",
    "yesssss",
    "Sadly,",
    "In a disappointing turn of events",
    "html5test.com added a test showing that",
    "There's a new benchmark reporting",
    "A new testsuite submitted to web-platform-tests determined that",
    "Everyone on twitter's talking about how",
    "TIL that",
    "In a head-to-head comparison,",
    "Slashdot can't stop talking about how",
    "Tom's Hardware published new measurements that show",
    "Ars Technica just published that",
    "Phoronix announced that",
    "ugh.",
    "whee,",
    "Huh!",
    "That's new -",
];

var competitor = [
    "Opera",
    "Microsoft Edge",
    "Internet Explorer",
    "Firefox",
    "Firefox OS",
    "Tofino",
    "Quantum",
    "Safari",
    "Mobile Safari",
    "Blackberry 10's browser",
    "Safari for Windows",
    "iTunes",
    "Brave",
    "Iceweasel",
    "Palemoon",
    "Chrome",
    "Chromium",
    "Chrome Mobile",
    "Lynx",
    "Links",
    "SeaMonkey",
    "WeaseyPrint",
    "Dillo",
    "Midori",
    "NetSurf",
    "Konqueror",
    "Netscape Navigator",
    "Mosaic"
];

function possessive_competitor() {
    var c = choose(competitor);
    if (c[c.length - 1] == 's') {
        return c + "'";
    }
    return c + "'s";
}

function tech() {
    var base = [
        "FPS",
        "CSS engine",
        "DOM API",
        "garbage collector",
        "JS engine",
        "platform integration",
        "crypto implementation",
        "network stack",
        "HTTP throughput",
        "emoji rendering",
        "memory safety",
        "text editing",
        "IndexedDB benchmarks",
        "WebGL implementation",
        "SVG implementation",
        "sandboxing",
        "process separation",
        "FTP support",
        "WebRTC",
        "Shadow DOM",
        "memory usage",
        "HDR colors",
        "printing support",
        "WebBluetooth",
        "WebMIDI",
        "WebWorker",
        "ServiceWorker",
        "2D canvas API",
        "form submission",
        "page navigation",
        "privacy",
        "cookie storage"
    ];

    var modifier = [
        "{} measurement",
        "{} performance",
        "{} coverage",
        "{} usage",
        "{} enforcement",
        "{} prevention",
        "async {}",
        "average {}",
        "responsive {}",
        "native {}",
        "GPU {}",
        "parallel {}",
        "concurrent {}",
        "experimental {}",
        "transpiled {}",
        "Rust-based {}",
        "C++-based {}"
    ];

    var elem = choose(base);
    if (Math.random() > 0.5) {
        return choose(modifier).replace("{}", elem);
    }
    return elem;
}

var negative_verb = [
    "crushed",
    "totally crushed",
    "dominated",
    "destroyed",
    "absolutely destroyed",
    "beat",
    "tied",
    "improved upon",
    "overtook",
    "surpassed",
    "outdid",
    "exceeded",
    "outperformed"
];

function whole_number() {
    return Math.floor(Math.random() * 100);
}

function percentage() {
    return whole_number() + "%";
}

function range_percentage() {
    var first = whole_number();
    var second = whole_number();
    return "" + Math.min(first, second) + "-" + Math.max(first, second) + "%";
}

var comparator = [
    "<",
    ">",
    "no less than",
    "less than",
    "just less than",
    "no more than",
    "more than",
    "way more than",
    "exactly",
    "precisely",
    "approximately",
    "around",
    "(on average)"
];

var unit = [
    "ns",
    "ms",
    "seconds",
    "minutes",
    "hours",
    "days",
    "bytes",
    "MB",
    "GB",
    "AU",
    "FPS",
    "b/s",
    "kb/s",
    "mb/s",
    "gb/s",
    "FLOPS"
];

function margin() {
    var margins = [
        "an underwhelming amount",
        "an overwhelming amount",
        [comparator, percentage],
        range_percentage,
        [whole_number, unit]
    ];
    return "by " + combine(choose(margins));
}

var self = "Servo";
var possessive_self = self + "'s";

var patterns = [
    [competitor, negative_verb, self, "in", tech],
    [competitor, negative_verb, possessive_self, tech],
    [competitor, negative_verb, possessive_self, tech, margin],
    [self, negative_verb, competitor, "in", tech],
    [self, negative_verb, possessive_competitor, tech],
    [self, negative_verb, possessive_competitor, tech, margin]
];

var ending = [
    " :)",
    "!",
    "!!",
    "!!!",
    ".",
    "..",
    "...",
    " :<",
    " - we should double check that.",
    ". Let's see if we can reproduce it!",
    ""
];

function reduce(item) {
    if (Array.isArray(item)) {
        return reduce(choose(item));
    }
    if (typeof item === "function") {
        return reduce(item());
    }
    return item;
}

function combine(list) {
    if (!Array.isArray(list)) {
        list = [list];
    }
    var combined = "";
    for (var i = 0; i < list.length; i++) {
        combined += reduce(list[i]) + ' ';
    }
    return combined.slice(0, combined.length - 1);
}

function newsflash() {
    var pattern = choose(patterns);
    var combined = combine(pattern);
    if (Math.random() > 0.5) {
        combined = choose(opener) + ' ' + combined;
    }
    return combined + choose(ending);
}

exports.createRumour = function() {
  return newsflash();
};
