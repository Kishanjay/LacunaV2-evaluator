const puppeteer = require("puppeteer");
const path = require("path");
const fs = require('fs-extra');

var instrumenter = require("./dynamic-deadfunction-detector/instrumenter_runner");

var cwd = process.cwd();
process.chdir('./todomvc/tests');
var frameworkPathLookup = require('./todomvc/tests/framework-path-lookup');
var frameworks = frameworkPathLookup();
process.chdir(cwd);

const TODOMVC_DIR = "todomvc";
const EXAMPLES_DIR = "examples.lacunized";
const EXAMPLES_OUTPUT_DIR = "examples.lacunized.instrumented";

function start() {
    createDestinationFolder(); // should work with EXAMPLES_OUTPUT_DIR after this
    
    frameworks.forEach((framework) => {
        let directory = generateFrameworkDirectory(framework);
         var options = {
            source: path.join(directory, 'index.html'),
            destination: directory,
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


/**
 * Fetches the directory for a framework
 */
function generateFrameworkDirectory({path: frameworkPath}) {
    frameworkPath = frameworkPath.splice(0, 8, EXAMPLES_OUTPUT_DIR); // append to examples    
    let pwdFrameworkPath = path.join(TODOMVC_DIR, frameworkPath);
    return pwdFrameworkPath;
}

/**
 * Creates and clears the new examples folder (that will be normalized)
 */
function createDestinationFolder() {
    examplesSource = path.join(TODOMVC_DIR, EXAMPLES_DIR);
    examplesDestination = path.join(TODOMVC_DIR, EXAMPLES_OUTPUT_DIR);

    if (fs.existsSync(examplesDestination) && fs.lstatSync(examplesDestination).isDirectory()) {
        fs.removeSync(examplesDestination);
    }

    fs.copySync(examplesSource, examplesDestination);
}