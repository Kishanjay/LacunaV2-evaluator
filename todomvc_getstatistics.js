const fs = require("fs");
const path = require("path");

var cwd = process.cwd();
process.chdir('./todomvc/tests');
var frameworkPathLookup = require('./todomvc/tests/framework-path-lookup');
var frameworks = frameworkPathLookup();

const STATISTICS_FILE = "statistics.csv";

/* Filenames should be inline with the instrumenter and instrumentation_server */
const ALIVE_FUNCTIONS_FILE = "_alive_functions.json";
const ALL_FUNCTIONS_FILE = "_all_functions.json";


/* Fetch all and alive functions from the frameworks and export to csv */
var csvData = "Framework,AllFunctions,AliveFunctions,DeadFunctions\n";
frameworks.forEach((framework) => {
    var aliveFunctionsPath = path.join("todomvc", "examples", framework.name, ALIVE_FUNCTIONS_FILE);
    var allFunctionsPath = path.join("todomvc", framework.path, ALL_FUNCTIONS_FILE);

    var numberOfAliveFunctions = countFunctions(aliveFunctionsPath);
    var numberOfFunctions = countFunctions(allFunctionsPath);
    var numberOfDeadFunctions = numberOfFunctions - numberOfAliveFunctions;

    csvData += `${framework.name},${numberOfFunctions},${numberOfAliveFunctions},${numberOfDeadFunctions}\n`;
});
fs.writeFileSync(path.join(__dirname, STATISTICS_FILE), csvData, 'utf8');




/* Helper functions */
function getFunctions(functionsFilePath) {
    return JSON.parse(fs.readFileSync(path.join(__dirname, functionsFilePath), 'utf8'));
}
function countFunctions(filePath) {
    try {
        var functions = getFunctions(filePath);
    } catch (e) { return 0; }
    return functions.length;
}