/**
 * @author Kishan Nirghin
 * 
 * @description Script that tries to figure out which functions were not picked
 * up by any analyzer as being alive.
 */
/**
 * @description
 * Runs each analyzer of Lacuna only ONCE on each application.
 * In contrast with the less efficient procedure where every combination of 
 * analyzers was run on Lacuna.
 * 
 * The results will be merged in a different script
 * This makes it also much easier to spot issues with certain analyzers on 
 * some frameworks.
 */
require("./prototype_extension");

const path = require("path");
const fs = require("fs-extra");

const TODOMVC_DIR = "todomvc";

const EXAMPLES_GROUNDTRUTH_DIR = "examples.done"; 
const EXAMPLES_DIR = "examples.lacunized.2";

const ANALYZERS = ["static", "nativecalls", "dynamic", "closure_compiler", "wala", "npm_cg", "tajs", "acg"];
const ALIVE_FUNCTIONS_FILE = "_alive_functions.json";
const ALL_FUNCTIONS_FILE = "_all_functions.json";

start().then(result => {
    console.log(result);
});


async function start() {
    const logfileName = generateLogfileName(ANALYZERS);
    let frameworks = getFrameworks();

    frameworks.forEach(framework => {
        const falsePositives = [];
        if (framework.name != 'backbone'){ return; }

        let groundtruthDirectory = generateGroundTruthFrameworkDirectory(framework);
        groundtruthDirectory = frameworkDirectoryException(framework, { directory: groundtruthDirectory, entry: null }).directory;

        let directory = generateFrameworkDirectory(framework);
        directory = frameworkDirectoryException(framework, { directory, entry: null }).directory;

        const aliveFunctions = loadJSONFile(path.join(groundtruthDirectory, ALIVE_FUNCTIONS_FILE));
        instrumenterFixFile(aliveFunctions, framework)
        const analyzerAliveFunctions = loadJSONFile(path.join(directory, logfileName)).aliveFunctions;

        console.log("Functions that were never picked up as alive, but are alive:");
        aliveFunctions.forEach(aliveFunction => {
            const match = analyzerAliveFunctions.some((analyzerAliveFunction) => {
                return aliveFunction.file == analyzerAliveFunction.file &&
                        aliveFunction.range[0] == analyzerAliveFunction.range[0] &&
                        aliveFunction.range[1] == analyzerAliveFunction.range[1];
            });
            if (!match) { falsePositives.push(aliveFunction); }
        });

        console.log("done");
        console.log("Not picked up as alive: " + falsePositives.length);
        console.log("Alive: " + aliveFunctions.length);
        console.log("Thought alive: " + analyzerAliveFunctions.length);


    });
}

/**
 * Fetches the todomvc- frameworks that will be used
 */
function getFrameworks() {
    const tests_dir = path.join(TODOMVC_DIR, "tests")
    const cwd = process.cwd(); // fixes relative path issue
    process.chdir(tests_dir);
    const frameworkPathLookup = require("./" + path.join(tests_dir, 'framework-path-lookup'));
    const frameworks = frameworkPathLookup();
    process.chdir(cwd);

    return frameworks;
}

/**
 * Fetches the directory for a framework
 */
function generateFrameworkDirectory({path: frameworkPath}) {
    frameworkPath = frameworkPath.splice(0, 8, EXAMPLES_DIR); // replaces examples
    let pwdFrameworkPath = path.join(TODOMVC_DIR, frameworkPath);
    return pwdFrameworkPath;
}
function generateGroundTruthFrameworkDirectory({path: frameworkPath}) {
    frameworkPath = frameworkPath.splice(0, 8, EXAMPLES_GROUNDTRUTH_DIR); // replaces examples
    let pwdFrameworkPath = path.join(TODOMVC_DIR, frameworkPath);
    return pwdFrameworkPath;
}

function frameworkDirectoryException(framework, options){
    /* Handle exceptions on the folder structure */
    if (framework.name == 'angular-dart') {
        options.directory = options.directory.slice(0, -4);
        options.entry = 'web/index.html';
    }
    if (framework.name == 'chaplin-brunch') {
        options.directory = options.directory.slice(0, -7);
        options.entry = 'public/index.html';
    }
    if (framework.name == 'duel') {
        options.directory = options.directory.slice(0, -4);
        options.entry = 'www/index.html';
    }
    if (framework.name == 'vanilladart') {
        options.directory = options.directory.slice(0, -10);
        options.entry = 'build/web/index.html';
    }

    return { directory: options.directory, entry: options.entry };
}


/**
 * Generates the name of the log file for a single analyzer, or for 
 * any combination of analyzers.
 */
function generateLogfileName(analyzer) {
    if (Array.isArray(analyzer)) {
        return "lacuna_" + analyzer.join(" ").replace(/ /gi, "") + ".log";
    }
    return "lacuna_" + analyzer + ".log";
}

function loadJSONFile(filepath) {
    return JSON.parse(fs.readFileSync(path.join(__dirname, filepath), 'utf8'));
}

function writeJSONfile(filepath, obj) {
    return fs.writeFileSync(path.join(__dirname, filepath),  JSON.stringify(obj, null, 4), 'utf8');
}


function instrumenterFixFile(funcs, framework) {
    var strip = 'todomvc/examples.lacunized.instrumented/' + framework.name;

    funcs.forEach((func) => {
        if (func.file.substr(0, strip.length) == strip) {
            func.file = func.file.substr(strip.length + 1);
        }
    });
}