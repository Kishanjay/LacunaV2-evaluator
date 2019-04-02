# Intro
This script will make it easy to run any kind of performance/statistics 
related test of lacuna.

Ultimately it will make all other stat-related lacuna tools unnecessary as 
this will be a complete replacement package capable of anything statistics 
and perfomance related.

# Functionality
The supported functionality is:

Extracting TodoMVC's used and unused functions (ground truth)
Running Lacuna on TodoMVC
Compare Lacuna's results with the ground truth
Lacuna should be used to generate the
_dead_functions_assumed_by_analysers.json

# How to use
Generating all execution traces can be done in different ways. 
The only real important thing we have to ensure is that all non-dead functions
are actually executed. 

Running all test-cases (assuming that they cover every aspect of the application)
should be a perfect solution. The only down-side is that many test-cases do not
trigger any un-executed function sofar. Therefore it takes considerably longer
to do this.

Also another limiation is that some frameworks cause the instrumenter to get 
overloaded. Alive functions are logged through an http request; handling 2000
of them asynchronously appears to be too much for the application. 

Another limiation is that it appears that some frameworks trigger an instrumentation
loop, therefore we shrink the available set a bit more.

## Presetup
Copy the dependent projects into this folder
`git clone todomvc`
`git clone dynamic-deadfunction-detector`
The expected file structure should be something like this:

```
dynamic-deadfunction-detector/
todomvc/
todomvc_runner.js
todomvc_instrumenter.js
..
..
```


`todomvc/tests/framework-path-lookup.js`
```
// custom filter out un-supported implementations
const EXCLUDED_FRAMEWORKS = ["angular2", "angularjs", "binding-scala", "atmajs", "backbone_marionette"];
list = list.filter(function (framework) {
    return EXCLUDED_FRAMEWORKS.indexOf(framework.name) === -1;
});

return list; // skip last filter 
```

## 1. Generate execution traces with existing test cases (takes a long time)

### Step 1.
Instrument all the todomvc JS functions using the todomvc_instrumenter.
The instrumentation code was based on dynamic-deadfunction-detector.

`node todomvc_instrumenter.js`

This will overwrite the ./examples/* folder with the instrumented source code.
_Note: a backup of the original will be kept in ./examples.back_


### Step 2.
Run the instrumentation server

`node todomvc_instrumentation_server.js`

This will store all alive functions and thus aquire the ground truth values

### Step 3.
Run todomvc server

`gulp test-server`

Server that hosts the todomvc projects

### Step 4.
Run the testcases

`npm run test`

This will generate all possible executions, thus ensure all alive functions
have been executed.


### Step 5.
Generate the statistics

`node todomvc_getstatistics`


## 2. Generate execution traces webdriver
** Incomplete **

### Step 1.
Modify the `todomvc_instrumenter.js`

Add option: `console: true`

This will ensure that th instrumentation code will not make http-requests 
Rather do (the more efficient) console logs instead

### Step 2.
Instrument the todomvc

`node todomvc_instrumenter.js`

This will overwrite the ./examples/* folder with the instrumented source code.
_Note: a backup of the original will be kept in ./examples.back_

### Step 3.
Execute webdriver that will automatically interact with the webpage

`node todomvc_runner.js`

### Step 4.
Generate the statistics

`node todomvc_getstatistics`


# Development

## Notes
Since this is only an evaluation tool, we tend to not store the actual optimized
versions of the code and try to use the expected results data-only.

## TODO
- Add the webdriver version to the 

## Dependencies
This script heavily relies on:
- todomvc

- lacuna

- dynamic-deadfunction-detector

If any of these projects change, this repo should be updated accordingly