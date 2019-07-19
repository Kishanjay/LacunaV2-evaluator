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
const lacuna = require("../LacunaV2/lacuna_runner");


const TODOMVC_DIR = "todomvc";
const EXAMPLES_DIR = "examples.normalized.nocl";
const EXAMPLES_OUTPUT_DIR = "examples.lacunized.2"; // different folder to keep things cleen

const ANALYZERS = ["static", "nativecalls", "dynamic", "closure_compiler", "wala", "npm_cg", "tajs", "acg"];


// mergeLacunaResults();
startLacuna().then((result) => {
    console.log("Finished Lacunization");
    mergeLacunaResults();
});

function mergeLacunaResults() {
    let analyserCombinations = generateAnalyserCombinations(ANALYZERS);
    console.log("Analyzer combinations to calculate: " + analyserCombinations.length);

    let frameworks = getFrameworks();

    frameworks.forEach(framework => {
        /**
         * Gather all data needed from a framework directory;
         * thus creates also the object containg all analyzer data
         */
        let directory = generateFrameworkDirectory(framework);
        directory = frameworkDirectoryException(framework, { directory, entry: null }).directory;

        const analyzerResult = {};

        ANALYZERS.forEach(analyzer => {
            let analyzerLogfile = generateLogfileName(analyzer);
            analyzerResult[analyzer] = loadJSONFile(path.join(directory, analyzerLogfile));
        });
        const allFunctions = analyzerResult['static'].allFunctions; // shouldn't really matter

        analyserCombinations.forEach(analyzerCombination => {
            analyzerCombination = analyzerCombination.split(" ");
            if (analyzerCombination.length == 1) { return; } // already have these
            const aliveFunctions = [];
            
            analyzerCombination.forEach(analyzer => {
                analyzerResult[analyzer]['aliveFunctions'].forEach(aliveFunction => {
                    /* Prevent duplicates from entering the array */
                    const match = aliveFunctions.some((storedAliveFunction) => {
                        return aliveFunction.file == storedAliveFunction.file &&
                            aliveFunction.range[0] == storedAliveFunction.range[0] &&
                            aliveFunction.range[1] == storedAliveFunction.range[1];
                    });
                    if (match) return;
                    aliveFunctions.push(aliveFunction);
                });
                
            });
            const deadFunctions = getDeadFunctions(allFunctions, aliveFunctions);
        
            const result = {
                deadFunctions: deadFunctions,
                aliveFunctions: aliveFunctions,
                allFunctions: allFunctions,
            }
            
            let resultLogfile = generateLogfileName(analyzerCombination);
            writeJSONfile(path.join(directory,resultLogfile), result);
        });
        
    });
}

function getDeadFunctions(allFunctions, aliveFunctions) {
    const deadFunctions = [];
    allFunctions.forEach(func => {
        const match = aliveFunctions.some((aliveFunction) => {
            return aliveFunction.file == func.file &&
                aliveFunction.range[0] == func.range[0] &&
                aliveFunction.range[1] == func.range[1];
        });
        if (match) return;

        deadFunctions.push(func);
    });
    return deadFunctions;
}

async function startLacuna() {
    let frameworks = getFrameworks();
    // createDestinationFolder(); // creates the destination folder

    let lacunaRunOptions = generateLacunaRunOptions(frameworks, ANALYZERS);
    console.log("Number of runOptions: " + lacunaRunOptions.length);
    
    for (let i = 225; i < lacunaRunOptions.length; i++){
        let lacunaRunOption = lacunaRunOptions[i];

        // skip certain analyzers for now.
        // if (lacunaRunOption.analyzer.includes("dynamic")) { continue; }
        // if (lacunaRunOption.analyzer.includes("wala")) { continue; }
        
        try {
            console.log("\n\nRunOption: " + i + "/" + lacunaRunOptions.length);
            await runLacuna(lacunaRunOption); // remove await for async **shocker**
        } catch (e) { console.log(e); }
        // NOTE: should wait for the dynamic analyser to function properly..
    }
    return;
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
function generateLacunaRunOptions(frameworks, analyzers) {
    var lacunaRunOptions = [];

    frameworks.forEach(framework => {
        let directory = generateFrameworkDirectory(framework);
        analyzers.forEach((analyzer) => {
            let logfile = generateLogfileName(analyzer); 
            let lacunaRunOption = { 
                directory: directory,
                analyzer: [analyzer],
                logfile: logfile,
                assumeNormalization: true, // should be normalized before starting
                force: true,
            };

            frameworkDirectoryException(framework, lacunaRunOption);

            lacunaRunOptions.push(lacunaRunOption);
        });
    });
    return lacunaRunOptions;
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
    frameworkPath = frameworkPath.splice(0, 8, EXAMPLES_OUTPUT_DIR); // replaces examples
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


function assert(assertion, msg) {
    if (!assertion) {
        console.log(msg);
        process.exit(1);
    }
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


/**
 * Creates and clears the new examples folder where the lacunized results 
 * will be stored
 */
function createDestinationFolder() {
    examplesSource = path.join(TODOMVC_DIR, EXAMPLES_DIR);
    examplesDestination = path.join(TODOMVC_DIR, EXAMPLES_OUTPUT_DIR);

    if (fs.existsSync(examplesDestination) && fs.lstatSync(examplesDestination).isDirectory()) {
        fs.removeSync(examplesDestination);
    }

    fs.copySync(examplesSource, examplesDestination);
}

function loadJSONFile(filepath) {
    return JSON.parse(fs.readFileSync(path.join(__dirname, filepath), 'utf8'));
}

function writeJSONfile(filepath, obj) {
    return fs.writeFileSync(path.join(__dirname, filepath),  JSON.stringify(obj, null, 4), 'utf8');
}