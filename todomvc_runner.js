/**
 * Script that will execute all todomvc projects and trigger all functions
 * Hosts its own server
 */
const puppeteer = require('puppeteer');

const express = require("express");
const app = express();
const port = 8000;

const fs = require("fs");
const path = require("path");

var cwd = process.cwd();
process.chdir('./todomvc/tests');
var frameworkPathLookup = require('./todomvc/tests/framework-path-lookup');
var frameworks = frameworkPathLookup();

const ALIVE_FILE = "_alive_functions.json";

process.chdir(cwd);

app.get("/todomvc_testcases.js", (req, res) => {
    res.sendFile(path.join(__dirname, "todomvc_testcases.js"));
});

app.use(express.static('todomvc'));

var server = app.listen(port, () => { console.log("TodoMVC server running on port " + port) });


(async () => {
    var browser = await puppeteer.launch({ headless: false }); // await
    

    for (var i = 0; i < 1; i++){
        var aliveFunctions = [];
        var framework = frameworks[i];
        var page = await browser.newPage();    
        await page.goto(`http://localhost:${port}/${framework.path}`);

        page.on('console', (msg) => {
            var consoleLog = msg.text();
            try {
                var functionData = JSON.parse(consoleLog);
                if (!functionData.file || !functionData.range) { return; }

                function exists(f) { return f.file == functionData.file && f.range[0] == functionData.range[0] && f.range[1] == functionData.range[1]; }
                if (!aliveFunctions.some(exists)) {
                    aliveFunctions.push(functionData);
                }
                
            } catch(e) {}
        });

        await page.addScriptTag({ url: '/todomvc_testcases.js' });

        await timeout(20000);
        
        var aliveFunctionsPath = path.join('todomvc', framework.path, ALIVE_FILE);
        fs.writeFileSync(aliveFunctionsPath, JSON.stringify(aliveFunctions), 'utf8');
        await page.close();
    }  
    
    browser.close();
    server.close();

    console.log("Finished");
    process.exit(0);
})();




function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}