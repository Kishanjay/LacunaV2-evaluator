/**
 * @author Kishan Nirghin
 * 
 * @description Generates the statistics.csv file
 * Combines the output of Lacuna with that of the instrumenter to say something
 * about the performance of each analyzer.
 * 
 * It fetches the lacuna output from the examples.back directory by default.
 * Also exports precision_recall.data and fscore.data which can be used 
 * to create various plots in R
 */
require("./prototype_extension");

const fs = require("fs");
const path = require("path");

/* Fix relative path issue */
var cwd = process.cwd();
process.chdir('./todomvc/tests');
var frameworkPathLookup = require('./todomvc/tests/framework-path-lookup');
var frameworks = frameworkPathLookup();
process.chdir(cwd);

const STATISTICS_FILE = "statistics.csv";

/* The analyzers that have been used by Lacuna */
const ANALYZERS = ["static nativecalls", "dynamic", "static nativecalls dynamic"];

/* make the analyzers more human friendly */
var AnalyzerMap = {
    "static nativecalls": "static",
    "dynamic": "dynamic",
    "static nativecalls dynamic": "hybrid"
};

/* Filenames should be inline with the instrumenter and instrumentation_server */
const ALIVE_FUNCTIONS_FILE = "_alive_functions.json";
const ALL_FUNCTIONS_FILE = "_all_functions.json";

/* Since we're looping over all data, lets also compute these things */
var stats = {
    static: { precisions: [], recalls: [], fscores: [] },
    dynamic: { precisions: [], recalls: [], fscores: [] },
    hybrid: { precisions: [], recalls: [], fscores: []},
};

/* Fetch all and alive functions from the frameworks and export to csv */
var csvData = "Framework,Analyzer,AllFunctions,DeadFunctions,ClaimedDeadFunctions,TrueDeadFunctions,AliveFunctions,ClaimedAliveFunctions,TrueAliveFunctions\n";
frameworks.forEach((framework) => {
    var aliveFunctionsPath = path.join("todomvc", "examples", framework.name, ALIVE_FUNCTIONS_FILE);
    var allFunctionsPath = path.join("todomvc", framework.path, ALL_FUNCTIONS_FILE);
    var lacunaOutputDir = path.join("todomvc", framework.path.splice(8, 0, ".back"));

    var allFunctions = loadJSONFile(allFunctionsPath);
    var aliveFunctions = loadJSONFile(aliveFunctionsPath);

    numberOfAliveFunctions = aliveFunctions.length;
    var numberOfFunctions = allFunctions.length;
    var numberOfDeadFunctions = numberOfFunctions - numberOfAliveFunctions;

    ANALYZERS.forEach(analyzer => {
        try {
            var analyzerLogFile = "lacuna_" + analyzer.replace(/ /gi, "") + ".log";
            var analyzerLogPath = path.join(lacunaOutputDir, analyzerLogFile);

            var lacunaObj = loadJSONFile(analyzerLogPath);

            var analyzerDeadFunctions = lacunaFixFile(lacunaObj.deadFunctions);
            var analyzerAliveFunctions = lacunaFixFile(lacunaObj.aliveFunctions);
            var analyzerAllFunctions = lacunaFixFile(lacunaObj.allFunctions);

            var analyzerNumberOfTrueDeadFunctions = countTrueDeadFunctions(analyzerDeadFunctions, aliveFunctions);
            var analyzerNumberOfFalseDeadFunctions = analyzerDeadFunctions.length - analyzerNumberOfTrueDeadFunctions;
            var analyzerNumberOfTrueAliveFunctions = numberOfAliveFunctions - analyzerNumberOfFalseDeadFunctions;

            csvData += `${framework.name},${AnalyzerMap[analyzer]},${analyzerAllFunctions.length},${numberOfDeadFunctions},${analyzerDeadFunctions.length},${analyzerNumberOfTrueDeadFunctions},${numberOfAliveFunctions},${analyzerAliveFunctions.length},${analyzerNumberOfTrueAliveFunctions}\n`    
        } catch (e) { console.log(e); }
    });
});

fs.writeFileSync(path.join(__dirname, STATISTICS_FILE), csvData, 'utf8');


/* Helper functions */
function loadJSONFile(functionsFilePath) {
    return JSON.parse(fs.readFileSync(path.join(__dirname, functionsFilePath), 'utf8'));
}

/**
 * The normalize function should be removed.
 */
function countTrueDeadFunctions(claimedDeadFunctions, aliveFunctions) {
    var counter = claimedDeadFunctions.length;
    claimedDeadFunctions.forEach((claimedDeadFunction) => {
        var match = aliveFunctions.some((aliveFunction) => {
            return path.normalize(aliveFunction.file) == path.normalize(claimedDeadFunction.file) &&
                aliveFunction.range[0] == claimedDeadFunction.range[0] &&
                aliveFunction.range[1] == claimedDeadFunction.range[1];
        });
        if (match) counter--; // for every alive deadfunction substract.
    });

    return counter;
}

/**
 * Fixes the file param of each dead/alive/all function.
 * Since Lacuna and the testcases are ran on different folders, the file
 * param differs: 
 *  'todomvc/examples/**' for the groundtruth values
 *  'todomvc/examples.back/**' for all Lacuna output
 * So we're removing the .back part of the Lacuna output for every function.
 */
function lacunaFixFile(funcs) {
    funcs.forEach((func) => {
        if (func.file.substring(16, 21) == '.back') {
            func.file = func.file.splice(16, 5);
        }
    });

    return funcs;
}


