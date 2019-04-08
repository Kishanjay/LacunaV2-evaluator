/**
 * @author Kishan Nirghin
 * 
 * @description Generates the statistics.csv file
 * Combines the output of Lacuna with that of the instrumenter to say something
 * about the performance of each analyzer.
 * 
 * It fetches the lacuna output from the examples.back directory by default.
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


/* Filenames should be inline with the instrumenter and instrumentation_server */
const ALIVE_FUNCTIONS_FILE = "_alive_functions.json";
const ALL_FUNCTIONS_FILE = "_all_functions.json";

/* Fetch all and alive functions from the frameworks and export to csv */
var csvData = "Framework,Analyzer,AllFunctions,AliveFunctions,DeadFunctions,TrueDeadFunctions,TrueAliveFunctions\n";
frameworks.forEach((framework) => {
    var aliveFunctionsPath = path.join("todomvc", "examples", framework.name, ALIVE_FUNCTIONS_FILE);
    var allFunctionsPath = path.join("todomvc", framework.path, ALL_FUNCTIONS_FILE);
    var lacunaOutputDir = path.join("todomvc", framework.path.splice(8, 0, ".back"));


    var aliveFunctions = loadJSONFile(aliveFunctionsPath);

    numberOfAliveFunctions = aliveFunctions.length;
    var numberOfFunctions = countFunctions(allFunctionsPath);
    var numberOfDeadFunctions = numberOfFunctions - numberOfAliveFunctions;

    csvData += `${framework.name},<groundtruth>,${numberOfFunctions},${numberOfAliveFunctions},${numberOfDeadFunctions},${numberOfDeadFunctions}/${numberOfDeadFunctions},${numberOfAliveFunctions}/${numberOfAliveFunctions}\n`;


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

            csvData += `${framework.name},${analyzer},${analyzerAllFunctions.length},${analyzerAliveFunctions.length},${analyzerDeadFunctions.length},${analyzerNumberOfTrueDeadFunctions}/${analyzerDeadFunctions.length}(P) ${analyzerNumberOfTrueDeadFunctions}/${numberOfDeadFunctions}(R),${analyzerNumberOfTrueAliveFunctions}/${numberOfAliveFunctions} (-${analyzerNumberOfFalseDeadFunctions})\n`;
        } catch (e) { console.log(e); }
    });
});

fs.writeFileSync(path.join(__dirname, STATISTICS_FILE), csvData, 'utf8');




/* Helper functions */
function loadJSONFile(functionsFilePath) {
    return JSON.parse(fs.readFileSync(path.join(__dirname, functionsFilePath), 'utf8'));
}
function countFunctions(filePath) {
    try {
        var functions = loadJSONFile(filePath);
    } catch (e) { return 0; }
    return functions.length;
}


function countTrueDeadFunctions(claimedDeadFunctions, aliveFunctions) {
    var counter = claimedDeadFunctions.length;
    claimedDeadFunctions.forEach((claimedDeadFunction) => {
        var match = aliveFunctions.some((aliveFunction) => {
            return aliveFunction.file == claimedDeadFunction.file &&
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