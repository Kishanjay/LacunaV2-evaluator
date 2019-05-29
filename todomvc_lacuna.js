/**
 * @description
 * Runs lacuna on all todomvc applications for each analyzer combination
 */
require("./prototype_extension");

const path = require("path");
const commandLineArgs = require("command-line-args");
const lacuna = require("../LacunaV2/lacuna_runner");


const TODOMVC_DIR = "todomvc";
const EXAMPLES_DIR = "examples.normalized";

const ANALYZERS = ["static", "nativecalls", "dynamic", "closure_compiler", "wala", "npm_cg", "tajs", "acg"];

start().then((result) => {
    console.log("Finished");
}).catch((e) => {
    console.log(e);
    console.log("catch error");
}).finally(() => {
    console.log("finally");
})

async function start() {
    let options = getRunOptions();
    assert(options, "Invalid options");

    let frameworks = getFrameworks(options);
    assert(frameworks, "Invalid frameworks");

    let analyserCombinations = generateAnalyserCombinations(ANALYZERS);
    assert(analyserCombinations, "Invalid analyserCombinations");

    let lacunaRunOptions = generateLacunaRunOptions(frameworks, analyserCombinations);
    assert(lacunaRunOptions, "Invalid lacunaRunOptions");

    if (options.simulate) { console.log(lacunaRunOptions); process.exit(); }
    
    /* Before running, normalize all frameworks according to Lacuna */
    lacunaNormalizeFrameworks(frameworks);
    return

    for (let lacunaRunOption of lacunaRunOptions) {
        
        let containsDynamic = lacunaRunOption.analyzer.includes("dynamic");
        
        if (options.skipDynamic && containsDynamic) continue;
        if (options.onlyDynamic && !containsDynamic) continue;

        await runLacuna(lacunaRunOption); // remove await for async **shocker**
        // NOTE: should wait for the dynamic analyser to function properly..
    }
}


/**
 * Gets the runOptions of this program 
 * combines the defaultOptions with the commandLineOptions
 */
function getRunOptions() {
    let defaultOptions = {
        offset: 0,
        length: 10,
        simulate: false,
        skipDynamic: false,
        onlyDynamic: false
    };
    try {
        let argv = commandLineArgs([
            { name: 'offset', type: Number, alias: 'o' },
            { name: 'length', type: Number, alias: 'l' },   
            { name: 'simulate', type: Boolean }, // DEBUG only log the runOptions (no execution)
            { name: 'skipDynamic', type: Boolean }, // Skips run that use dynamic analyser
            { name: 'onlyDynamic', type: Boolean} // Only do runs that use dynamic analyser
        ]);
        defaultOptions.extend(argv);
    } catch (e) { throw new Error(e); }
    finally {
        return defaultOptions;
    }
}


/**
 * Fetches the todomvc- frameworks that will be used
 */
function getFrameworks({ offset, length }) {
    const tests_dir = path.join(TODOMVC_DIR, "tests")
    const cwd = process.cwd(); // fixes relative path issue
    process.chdir(tests_dir);
    const frameworkPathLookup = require("./" + path.join(tests_dir, 'framework-path-lookup'));
    const frameworks = frameworkPathLookup().slice(offset, offset + length);
    process.chdir(cwd);

    return frameworks;
}

/**
 * Will create all combinations of analysers as a space seperated string.
 * 
 * @param {*} analysers array of analysers that will be considered for the
 * combinations.
 */
function generateAnalyserCombinations(analysers) {
    let result = [];
    let f = function(prefix, items) {
        for (let i = 0; i < items.length; i++) {
            let analyserCombination = (prefix + " " + items[i]).trim();
            result.push(analyserCombination);
            f(analyserCombination, items.slice(i + 1));
        }
    }
    f('', analysers);
    return result;
}

/**
 * Generates all runOptions of Lacuna.
 * For now that means to gather runoptions for every analyzer
 * for every framework
 */
function generateLacunaRunOptions(frameworks, analyserCombinations) {
    var lacunaRunOptions = [];

    frameworks.forEach(framework => {
        let directory = generateFrameworkDirectory(framework);
        analyserCombinations.forEach((analyserCombination) => {
            /* Create new object for every setup */
            let logfile = "lacuna_" + analyserCombination.replace(/ /gi, "") + ".log";
            let lacunaRunOption = { 
                directory: directory,
                analyzer: analyserCombination.split(" "), // as an array,
                logfile: logfile,
                assumeNormalization: true, // should be normalized before starting
            };
            
            lacunaRunOptions.push(lacunaRunOption);
        });
    });
    return lacunaRunOptions;
}

/**
 * Lacuna normalizes the frameworks 
 * - exports inline JS
 * - imports externally hosted JS
 * - exports eventAttributes to a file
 */
function lacunaNormalizeFrameworks(frameworks) {
    frameworks.forEach(framework => {
        let directory = generateFrameworkDirectory(framework);
        /* Create new object for every setup */
        let normalizeRunOption = { 
            directory: directory,
            entry: "index.html",
            normalizeOnly: true
        };
        
        lacuna.run(normalizeRunOption);
    });
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
 * Fetches the directory for a framework
 */
function generateFrameworkDirectory({path: frameworkPath}) {
    frameworkPath = frameworkPath.splice(0, 8, EXAMPLES_DIR); // append to examples
    process.exit();
    
    let pwdFrameworkPath = path.join(TODOMVC_DIR, frameworkPath);
    return pwdFrameworkPath;
}


function assert(assertion, msg) {
    if (!assertion) {
        console.log(msg);
        process.exit(1);
    }
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