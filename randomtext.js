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

function choose(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function whole_number() {
    return Math.floor(Math.random() * 100);
}

function percentage() {
    return whole_number() + "%";
}

exports.reduce = reduce;
exports.choose = choose;
exports.combine = combine;
exports.whole_number = whole_number;
exports.percentage = percentage;
