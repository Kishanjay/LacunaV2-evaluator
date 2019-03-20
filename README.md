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


## Notes 
- because of the size of todomvc this is kept in a seperate project
- Since this only is an evaluator, no real optimized version of the code has to 
be stored, we're only interested in the data

# How to use
Step 1.
Instrument all the todomvc JS functions using the todomvc_instrumenter.
The instrumentation code was based on dynamic-deadfunction-detector.

`node todomvc_instrumenter.js`

This will overwrite the ./examples/* folder with the instrumented source code.
_Note: a backup of the original will be kept in ./examples.back_


Step 2.
Run the instrumentation server

`node todomvc_instrumentation_server.js`

This will store all alive functions and thus aquire the ground truth values

Step 3.
Run todomvc server

`gulp test-server`

Server that hosts the todomvc projects

Step 4.
Run the testcases

`npm run test`

This will generate all possible executions, thus ensure all alive functions
have been executed.


Step 5.
Generate the statistics

`npm todomvc_getstatistics`
