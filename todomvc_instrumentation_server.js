'use strict';

const express = require("express"),
    path = require("path"),
    fs = require("fs"),
    bodyParser = require("body-parser");

const app = express()
const port = 8004

const ALIVE_FILE = "_alive_functions.json";


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
    extended: true
}));
// parse application/json
app.use(bodyParser.json())

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

function buildPath(framework, file) {
    return path.join("todomvc", "examples", framework, file);
}


app.listen(port, () => {
    console.log(`Instrumentation_server listening on port ${port}!`);
});