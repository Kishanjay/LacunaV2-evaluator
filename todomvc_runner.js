/**
 * Script that will execute all todomvc projects and trigger all functions
 * Hosts its own server
 */
const puppeteer = require('puppeteer');

const express = require("express");
const app = express();
const port = 8000;

const path = require("path");

var cwd = process.cwd();
process.chdir('./todomvc/tests');
var frameworkPathLookup = require('./todomvc/tests/framework-path-lookup');
var frameworks = frameworkPathLookup();

var EXCLUDED_FRAMEWORKS = ["angular2"];

process.chdir(cwd);

app.get("/todomvc_testcases.js", (req, res) => {
    res.sendFile(path.join(__dirname, "todomvc_testcases.js"));
});

app.use(express.static('todomvc'));

(async () => {
    var browser = await puppeteer.launch({ headless: false }); // await
    

    for (var i = 0; i < 1; i++){
        var framework = frameworks[i];
        var page = await browser.newPage();    

        await page.goto(`http://localhost:${port}/${framework.path}`);
        await page.addScriptTag({ url: '/todomvc_testcases.js' });
        
        await timeout(100000);
        await page.close();
    }    
})();

app.listen(port, () => { console.log("TodoMVC server running on port " + port) });


function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}