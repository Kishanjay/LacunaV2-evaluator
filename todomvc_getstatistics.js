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
var csvData = "Framework,Analyzer,AllFunctions,AliveFunctions,DeadFunctions,TrueDeadFunctions,TrueAliveFunctions\n";
frameworks.forEach((framework) => {
    var aliveFunctionsPath = path.join("todomvc", "examples", framework.name, ALIVE_FUNCTIONS_FILE);
    var allFunctionsPath = path.join("todomvc", framework.path, ALL_FUNCTIONS_FILE);
    var lacunaOutputDir = path.join("todomvc", framework.path.splice(8, 0, ".back"));

    var allFunctions = loadJSONFile(allFunctionsPath);
    var aliveFunctions = loadJSONFile(aliveFunctionsPath);

    numberOfAliveFunctions = aliveFunctions.length;
    var numberOfFunctions = allFunctions.length;
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

            csvData += `${framework.name},${AnalyzerMap[analyzer]},${analyzerAllFunctions.length},${analyzerAliveFunctions.length},${analyzerDeadFunctions.length},${analyzerNumberOfTrueDeadFunctions}/${analyzerDeadFunctions.length}(P) ${analyzerNumberOfTrueDeadFunctions}/${numberOfDeadFunctions}(R),${analyzerNumberOfTrueAliveFunctions}/${numberOfAliveFunctions} (-${analyzerNumberOfFalseDeadFunctions})\n`;

            /**
             * Store the precision, recall, and fscore of this framework into 
             * the array.
             */
            var precision = analyzerNumberOfTrueDeadFunctions / analyzerDeadFunctions.length;
            var recall = analyzerNumberOfTrueDeadFunctions / numberOfDeadFunctions;
            var fscore = 2 * ((precision * recall) / (precision + recall));

            stats[AnalyzerMap[analyzer]].precisions.push(precision);
            stats[AnalyzerMap[analyzer]].recalls.push(recall);
            stats[AnalyzerMap[analyzer]].fscores.push(fscore);
            
        } catch (e) { console.log(e); }
    });
});

fs.writeFileSync(path.join(__dirname, STATISTICS_FILE), csvData, 'utf8');


/**
 * A bit of a sloppy piece to calculate the precision, recall and f-scores..
 * at first it computes the precision, recall and f-score for every framework
 * and stores that value into an array. Followed by a part where calculates
 * the averages of all.
 * 
 * The add function is a helper function for the reduce func.
 */
function add(x, y) { return x + y; }
var mean = {
    static: { precision: null, recall: null, fscore: null },
    dynamic: { precision: null, recall: null, fscore: null },
    hybrid: { precision: null, recall: null, fscore: null }
};
mean.static.precision = stats.static.precisions.reduce(add) / stats.static.precisions.length;
mean.static.recall = stats.static.recalls.reduce(add) / stats.static.recalls.length;
mean.static.fscore = stats.static.fscores.reduce(add) / stats.static.fscores.length;
mean.dynamic.precision = stats.dynamic.precisions.reduce(add) / stats.dynamic.precisions.length;
mean.dynamic.recall = stats.dynamic.recalls.reduce(add) / stats.dynamic.recalls.length;
mean.dynamic.fscore = stats.dynamic.fscores.reduce(add) / stats.dynamic.fscores.length;
mean.hybrid.precision = stats.hybrid.precisions.reduce(add) / stats.hybrid.precisions.length;
mean.hybrid.recall = stats.hybrid.recalls.reduce(add) / stats.hybrid.recalls.length;
mean.hybrid.fscore = stats.hybrid.fscores.reduce(add) / stats.hybrid.fscores.length;

var data = linearExport(stats.static.precisions, stats.static.recalls, stats.dynamic.precisions, stats.dynamic.recalls, stats.hybrid.precisions, stats.hybrid.recalls);
data = `staticPrecision \t staticRecall \t dynamicPrecision \t dynamicRecall \t hybridPrecision \t hybridRecall \n` + data; 
fs.writeFileSync(path.join(__dirname, "precision_recall.data"), data, 'utf8');

console.log(mean);




/* Helper functions */
function loadJSONFile(functionsFilePath) {
    return JSON.parse(fs.readFileSync(path.join(__dirname, functionsFilePath), 'utf8'));
}

/**
 * Helper function that exports data in columns. e.g. passing x arrays of length
 * y will export every y values of x[i] on the ith column.
 * 
 * Making it readable by R with the read.table and fetching x[i] with rx[,i]
 */
function linearExport() {
    var lExport = "";
    /* error checking */
    var columnLength = arguments[0].length;
    for (var i = 0; i < arguments.length; i++) {
        if (arguments[i].length != columnLength) {
            console.log("Warning invalid columnLength: " + arguments[i].length);
        }
    }
    /* export lines */
    for (var i = 0; i < columnLength; i++) {
        var line = "";
        for (var j = 0; j < arguments.length; j++) {
            line += arguments[j][i] + '\t';
        }
        lExport += line + '\n';
    }
    
    return lExport;
}




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


