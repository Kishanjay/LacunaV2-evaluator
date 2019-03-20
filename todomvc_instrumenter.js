const puppeteer = require("puppeteer");
const path = require("path");
const fs = require('fs-extra');

var instrumenter = require("./dynamic-deadfunction-detector/instrumenter_runner");

var cwd = process.cwd();
process.chdir('./todomvc/tests');
var frameworkPathLookup = require('./todomvc/tests/framework-path-lookup');
var frameworks = frameworkPathLookup();
process.chdir(cwd);

const EXAMPLES_PATH = "./todomvc/examples";
const EXAMPLES_BACKUP_PATH = "./todomvc/examples.back";

function start() {
    if (fs.existsSync(EXAMPLES_BACKUP_PATH) && fs.lstatSync(EXAMPLES_BACKUP_PATH).isDirectory()) {
        console.log(`Warning it looks like the sourcecode is already instrumented`);
        console.log(`Please verify '${EXAMPLES_PATH}' and delete '${EXAMPLES_BACKUP_PATH}'`);
        process.exit(1);
    }

    fs.copySync(EXAMPLES_PATH, EXAMPLES_BACKUP_PATH);

    
    frameworks.forEach((framework) => {
        var entryPath = path.join('todomvc', framework.path);
         var options = {
            source: path.join(entryPath, 'index.html'),
            destination: entryPath,
            force: true,
             label: framework.name,
            unique: true,
         }
        try {
            instrumenter.run(options);
        } catch (error) {
            console.log(error);
        }
    });
}

start();