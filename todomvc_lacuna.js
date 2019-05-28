/**
 * @description
 * Runs lacuna on all todomvc applications for each [ANALYZERS]
 */
require("./prototype_extension");

const path = require("path");
const commandLineArgs = require("command-line-args");
const lacuna = require("../LacunaV2/lacuna_runner");

/* Fix relative path issue */
const cwd = process.cwd();
process.chdir('./todomvc/tests');
var frameworkPathLookup = require('./todomvc/tests/framework-path-lookup');
var frameworks = frameworkPathLookup();
process.chdir(cwd);

/* The (combination of) analysers that lacuna will use on the todomvc */
const ANALYZERS = ["static nativecalls", "dynamic", "static nativecalls dynamic"];

/* Actual execution of the code */
try {
    /** 
     * Options for the Lacuna runner. 
     * Mostly to prevent the heap out of memory error
     */
    let options = {
        offset: 0,
        length: 10,
        simulate: false,
    };
    let argv = commandLineArgs([
        { name: 'offset', type: Number, alias: 'o' },
        { name: 'length', type: Number, alias: 'l' },
        { name: 'simulate', type: Boolean, alias: 's' },
    ]);
    options.extend(argv);

    start(options).then(() => { console.log("done"); });
} catch (e) { console.log(e);}




/**
 * Function to run lacuna synchronously 
 * is required for the dynamic analyzer to work.
 */
async function start(options) {
    var runOptions = generateRunOptions(options.offset, options.length);
    if (options.simulate) { console.log(runOptions); process.exit(); }
    
    for (var i = 0; i < runOptions.length; i++) {
        console.log(`\n\nLacuna_runner [${i}/${runOptions.length-1}] FROM [${options.offset}-${options.length}]`);
        await runLacuna(runOptions[i]); // remove await for async **shocker**
    }
}

/**
 * Lacuna promise required for synchronous execution
 */
function runLacuna(runOption) {
    return new Promise((resolve, reject) => {
        try { lacuna.run(runOption, (log) => { resolve(log); }); }
        catch (e) { console.log(e); reject(e); }
    });
}

/**
 * Generates all runOptions of Lacuna.
 * For now that means to gather runoptions for every analyzer
 * for every framework
 */
function generateRunOptions(offset, length) {
    currentFrameworks = frameworks.slice(offset, offset + length); // nifty lil thing to skip frameworks. / debug
    var runOptions = [];
    currentFrameworks.forEach(framework => {
        let directory = generateFrameworkDirectory(framework);
        ANALYZERS.forEach((analyzer) => {
            /* Create new object for every setup */
            let runOption = { 
                directory: directory,
                analyzer: null,
                entry: "index.html",
                destination: null,
                logfile: null,
                timeout: null,
                olevel: 0,
                force: false,
            };
            runOption.analyzer = analyzer.split(" ");
            runOption.logfile = "lacuna_" + analyzer.replace(/ /gi, "") + ".log";
            runOptions.push(runOption);
        });
    });
    return runOptions;
}

/**
 * Fetches the correct directory for a framework
 * Currently uses the backup directory since there is a chance that the
 * original todomvc is already overwritten with instrumentation code
 */
function generateFrameworkDirectory(framework) {
    var frameworkPath = framework.path;
    frameworkPath = frameworkPath.splice(8, 0, ".back");
    frameworkPath = path.join("todomvc", frameworkPath);
    return frameworkPath;
}



function runDebug() {
    let directory = generateFrameworkDirectory(frameworks[10]);
    let analyzer = ANALYZERS[0];

    let runOptions = {
        directory: directory,
        analyzer: null,
        entry: "index.html",
        destination: null,
        logfile: null,
        timeout: null,
        olevel: 0,
        force: false,
    };

    runOptions.analyzer = analyzer.split(" ");
    runOptions.logfile = "lacuna_" + analyzer.replace(/ /gi, "") + ".log";
    try {
        lacuna.run(runOptions);
    } catch (e) { console.log(e); }
    
}