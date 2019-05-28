/**
 * @author Kishan Nirghin
 * @description A modified version of the instrumentation_server from the 
 * dynamic-deadfunction-detector repository. The main difference is that this
 * server is specifically designed to work with the todomvc -- meaning that
 * it will automatically associate the incomming data with a framework and
 * store the alive functions in its respective folder.
 */
'use strict';


/**
 * The goal of this program: store all alive functions
 * ALIVE_FILE contains the relative file-path where it will be stored
 */ 
const ALIVE_FILE = "_alive_functions.json";

/* The base path will be fetched from the framework path */
var cwd = process.cwd();
process.chdir('./todomvc/tests');
var frameworkPathLookup = require('./todomvc/tests/framework-path-lookup');
var frameworks = frameworkPathLookup();
process.chdir(cwd);


const express = require("express"),
    path = require("path"),
    fs = require("fs"),
    bodyParser = require("body-parser");
const app = express()
const port = 8004


app.use(bodyParser.urlencoded({
    extended: true // parse application/x-www-form-urlencoded
}));
app.use(bodyParser.json()) // parse application/json

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


/**
 * When running instrumented source code, every alive method will trigger
 * this function
 */
app.post('/alivefunction', (req, res) => {
    var func = req.body;
    aliveFunctionHandler(func);    
    res.send(JSON.stringify(req.body));
});

function aliveFunctionHandler(functionData) {
    var framework = functionData.label; /** name of the framework is passed as label */

    var aliveFunctionsPath = buildPath(framework, ALIVE_FILE);
    if (!fs.existsSync(aliveFunctionsPath)) {
        fs.writeFileSync(aliveFunctionsPath, "[]", 'utf8'); // default
    }

    var aliveFunctions = JSON.parse(fs.readFileSync(aliveFunctionsPath, 'utf8'));

    function exists(func) {
        return (func.file == functionData.file &&
            func.range[0] == functionData.range[0] &&
            func.range[1] == functionData.range[1]);
    }

    if (!aliveFunctions.some(exists)) {
        aliveFunctions.push(functionData);
    }
    
    fs.writeFileSync(aliveFunctionsPath, JSON.stringify(aliveFunctions), 'utf8');
}

function buildPath(frameworkName, file) {
    var framework = frameworks.find(fw => {
        return fw.name == frameworkName;
    });
    if (!framework) {
        console.log(`ERROR cannot find ${frameworkName} in frameworks`);
        return path.join("todomvc", "examples", frameworkName, file);    
    }

    return path.join("todomvc", framework.path, file);
}


app.listen(port, () => {
    console.log(`Instrumentation_server listening on port ${port}!`);
});