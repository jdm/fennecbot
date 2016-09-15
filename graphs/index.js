let { choose } = require("../randomtext");
child = require('child_process');
imgur = require('imgur');

var Graph = require('graphlib').Graph;
var dot = require('graphlib-dot');
var graphviz2svg = require('graphviz2svg');

var tech = [
    "WebRender",
    "Constellation",
    "Pipeline",
    "Layout",
    "Script",
    "DOM",
    "SpiderMonkey",
    "WebWorker",
    "ServiceWorker",
    "SharedWorker",
    "GPU",
    "CPU",
    "Fetch",
    "XML",
    "VRML",
    "WebVR",
    "Promise",
    "Scheduler",
    "Timer",
    "UTF-8 encoder",
    "UTF-16 encoder",
    "WTF-8 encoder",
    "MP4 demuxer",
    "FPGA",
    "Android",
    "JNI",
    "Cocoa",
    "Glutin",
    "GLFW",
    "Compositor",
    "Event loop",
    "v8",
    "JIT",
    "Proxy",
    "Sandbox",
    "Software transactional memory",
    "L1 cache",
    "Lockless queue",
    "Hashtable",
    "Emscripten",
    "asm.js",
    "wasm",
    "WebSocket",
    "HTTP",
    "TLS",
    "SSL",
    "node.js",
    "WebGL",
    "X11",
    "Wayland",
    "VNC",
    "CSS",
    "Style system",
    "WebAudio",
    "Media layer",
    "IPC",
    "LLVM",
    "FFI",
    "Rust",
    "JavaScript",
    "XMLHttpRequest",
    "VP9 decoder",
    "Opus decoder",
    "H.264 decoder",
    "Mesa",
    "RustTLS",
    "NSS",
    "OpenSSL",
    "FTP",
    "Shader",
    "VBO",
    "HTML",
    "XML",
    "2d canvas"
];

var suffix = [
    "helper",
    "proxy",
    "worker",
    "thread",
    "cache",
    "engine",
    "prototype",
    "compiler",
    "queue",
    "parser",
    "API"
];

var prefix = [
    "GPU-based",
    "Hardware-accelerated",
    "Fallback",
    "Parallel",
    "Sandboxed",
    "Multicore",
    "Multiprocess",
    "Threaded",
    "Software",
    "Naive",
    "Specialized",
    "Self-hosted",
    "Native",
    "Privileged"
];

function randint(min, max) {
    return Math.floor(Math.random() * max + min);
}

function randomGraph(label) {
    var g = new Graph({multigraph: true});
    g.setNode(label);
    var numNodes = randint(3, 15);
    var numEdges = numNodes + randint(0, 7);
    while (numNodes--) {
        var s = choose(tech);
        if (Math.random() > 0.75) {
            s += ' ' + choose(suffix);
        }
        if (Math.random() > 0.85) {
            s = choose(prefix) + ' ' + s;
        }
        g.setNode(s);
    }
    while (numEdges--) {
        g.setEdge(choose(g.nodes()), choose(g.nodes()));
    }
    return g;
}

function writeGraph(g) {
    var source = dot.write(g);
    return child.spawnSync("dot", ["-Tpng", ">out.png"], {input: source, shell: true});
}

function convertGraph(g, cb) {
    var result = writeGraph(g);
    if (result.status == 0) {
        imgur.uploadFile('out.png')
             .then(function(json) { cb(json.data.link) })
             .catch(function(err) { console.error(err.message) });
    }

    /*var source = dot.write(g).replace('graph {', 'graph G {');
    var full = 'data:image/svg+xml,' + graphviz2svg.digraph2svg(source)
                                                   .replace(/&#45;/g, '-')
                                                   .replace(/\n/g, '');
    var reduced = '';
    var i = 0;
    while (i < full.length) {
        var current = full.substring(i);
        var commentStart = current.indexOf('<!--');
        if (commentStart != -1) {
            reduced += current.substring(0, commentStart);
            var commentEnd = current.indexOf('-->');
            i += commentEnd + '-->'.length;
        } else {
            reduced += current;
            break;
        }
    }
    return reduced;*/
}

exports.randomGraph = randomGraph;
exports.convertGraph = convertGraph;
exports.writeGraph = writeGraph;
