/**
 * @author Kishan Nirghin
 * 
 * @description Generates the statistics for every todomvc project
 * creates the files in the statistics folder. Which will contain specific 
 * statistics about each framework individually. 
 * 
 * Generates the statistics.csv file which contains the average performance
 * of each analyser combination
 * 
 * NOTE: requires a log file for every analyzer combination
 */
require("./prototype_extension");

const fs = require("fs");
const path = require("path");

const TODOMVC_DIR = "todomvc";
const EXAMPLES_DIR = "examples.lacunized.2"; /* With the lacunized logs */
const EXAMPLES_DIR_GROUNDTRUTH = "examples.done"; /* With the ground truth values */
const STATISTICS_FOLDER = "statistics";

/**
 * Use the same frameworks that have been tested
 */
var cwd = process.cwd();
process.chdir('./todomvc/tests');
var frameworkPathLookup = require('./todomvc/tests/framework-path-lookup');
var frameworks = frameworkPathLookup();
process.chdir(cwd);

/* The analyzers that have been used by Lacuna */
const ANALYZERS = ["static", "nativecalls", "dynamic", "closure_compiler", "wala", "npm_cg", "tajs", "acg"]; //should be in the same order as the todomvc_lacuna script
let analyserCombinations = generateAnalyserCombinations(ANALYZERS);

/* Filenames should be inline with the instrumenter and instrumentation_server */
const ALIVE_FUNCTIONS_FILE = "_alive_functions.json";
const ALL_FUNCTIONS_FILE = "_all_functions.json";

/* Create the stats file for every framework */
frameworks.forEach((framework) => {
    exportFrameworkStatistics(framework);
});


function exportFrameworkStatistics(framework) {
    let groundTruthDirectory = generateGroundTruthFrameworkDirectory(framework);
    let directory = generateFrameworkDirectory(framework);
    var aliveFunctionsPath = path.join(TODOMVC_DIR, EXAMPLES_DIR_GROUNDTRUTH, framework.name, ALIVE_FUNCTIONS_FILE); // stored somewhere else than the framework folder
    var allFunctionsPath = path.join(groundTruthDirectory, ALL_FUNCTIONS_FILE); 

    try {
        var allFunctions = loadJSONFile(allFunctionsPath);
        instrumenterFixFile(allFunctions, framework);
        var aliveFunctions = loadJSONFile(aliveFunctionsPath);
        instrumenterFixFile(aliveFunctions, framework)
    } catch (e) {
        return // cant continue for this framework
    }

    numberOfAliveFunctions = aliveFunctions.length;
    var numberOfFunctions = allFunctions.length;
    var numberOfDeadFunctions = numberOfFunctions - numberOfAliveFunctions;

    var csvData = "Analyzer,AllFunctions,DeadFunctions,PredictedDeadFunctions,TrueDeadFunctions(TP),AliveFunctions,PredictedAliveFunctions,TrueAliveFunctions,Accuracy,Precision,Recall,Fscore\n";
    analyserCombinations.forEach(analyzercomb => {
        try {
            var analyzerLogFile = "lacuna_" + analyzercomb.replace(/ /gi, "") + ".log";
            var analyzerLogPath = path.join(directory, analyzerLogFile);

            try {
                var lacunaObj = loadJSONFile(analyzerLogPath);
            } catch (e) {
                return //cant continue for this analyserCombination
            }

            var analyzerDeadFunctions = lacunaFixFile(lacunaObj.deadFunctions);
            var analyzerAliveFunctions = lacunaFixFile(lacunaObj.aliveFunctions);
            var analyzerAllFunctions = lacunaFixFile(lacunaObj.allFunctions);

            var analyzerNumberOfTrueDeadFunctions = countTrueDeadFunctions(analyzerDeadFunctions, aliveFunctions);
            var analyzerNumberOfFalseDeadFunctions = analyzerDeadFunctions.length - analyzerNumberOfTrueDeadFunctions;

            /**
             * NumberOfAliveFunctions = all alive functions according to the instrumenter.
             * analyzerNumberOfTrueDeadFunctions = All functions that were not dead according to the analyzer (undetected), that are not alive.
             * analyzerNumberOfFalseDeadFunctions = The claimed dead functions - the amount that is actually dead 
             *                                    = functions that were not detected by the analyzer but were alive
             * analyzerNumberOfTrueAliveFunctions = Detected alive functions that were alive
             */
            var analyzerNumberOfTrueAliveFunctions = numberOfAliveFunctions - analyzerNumberOfFalseDeadFunctions;

            // confusion matrix code
            var tp = analyzerNumberOfTrueDeadFunctions;
            var fp = analyzerDeadFunctions.length - tp;
            var tn = analyzerNumberOfTrueAliveFunctions;
            var fn = analyzerAliveFunctions.length - tn;

            var accuracy = (tn + tp) / (analyzerAllFunctions.length);
            var precision = tp / analyzerDeadFunctions.length;
            var recall = analyzerNumberOfTrueAliveFunctions / numberOfAliveFunctions;
            var fscore = 2 * ((precision * recall) / (precision + recall));

            var significance = 4;
            accuracy = accuracy.toFixed(significance);
            precision = precision.toFixed(significance);
            recall = recall.toFixed(significance);
            fscore = fscore.toFixed(significance);

            csvData += `${analyzercomb},${analyzerAllFunctions.length},${numberOfDeadFunctions},${analyzerDeadFunctions.length},${analyzerNumberOfTrueDeadFunctions},${numberOfAliveFunctions},${analyzerAliveFunctions.length},${analyzerNumberOfTrueAliveFunctions},${accuracy},${precision},${recall},${fscore}\n`;
        } catch (e) { console.log(e); }
    });

    fs.writeFileSync(path.join(__dirname, STATISTICS_FOLDER, framework.name + ".csv"), csvData, 'utf8');
}





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


function instrumenterFixFile(funcs, framework) {
    var strip = 'todomvc/examples.lacunized.instrumented/' + framework.name;

    funcs.forEach((func) => {
        if (func.file.substr(0, strip.length) == strip) {
            func.file = func.file.substr(strip.length + 1);
        }
    });
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


function generateFrameworkDirectory({path: frameworkPath}) {
    frameworkPath = frameworkPath.splice(0, 8, EXAMPLES_DIR); // append to examples    
    let pwdFrameworkPath = path.join(TODOMVC_DIR, frameworkPath);
    return pwdFrameworkPath;
}

function generateGroundTruthFrameworkDirectory({path: frameworkPath}) {
    frameworkPath = frameworkPath.splice(0, 8, EXAMPLES_DIR_GROUNDTRUTH); // append to examples    
    let pwdFrameworkPath = path.join(TODOMVC_DIR, frameworkPath);
    return pwdFrameworkPath;
}