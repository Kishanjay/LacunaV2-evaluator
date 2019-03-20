const fs = require("fs");
const path = require("path");

var cwd = process.cwd();
process.chdir('./todomvc/tests');
var frameworkPathLookup = require('./todomvc/tests/framework-path-lookup');
var frameworks = frameworkPathLookup();

var EXCLUDED_FRAMEWORKS = ["angular2"];


var filePath0 = "todomvc/examples/ampersand/_all_functions.json";

var filePath1 = "todomvc/examples/ampersand/_alive_functions.json";
var filePath2 = "todomvc/examples/ampersand/_alive_functions_browser.json";
var filePath3 = "todomvc/examples/ampersand/_alive_functions_test.json";


function countFunctions(filePath) {
    var functions = JSON.parse(fs.readFileSync(path.join(__dirname, filePath), 'utf8'));
    console.log(`File: ${filePath} has ${functions.length} functions`);
}

countFunctions(filePath0);
countFunctions(filePath1);
// countFunctions(filePath2);
// countFunctions(filePath3);