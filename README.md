# Intro
Repo for evaluating Lacuna on various projects.
This repo contains all source code to evaluate the effectivity of the different
(combinations of) analysers on the todomvc project.

# How it works
The ground truth values of the todomvc project are gathered with the help of
extensive test-cases and the dynamic-deadfunction-detector repo; which 
automatically logs all alive functions.

After which Lacuna is applied to each of there projects with all different
combinations of analysers.

The results are compared and a confusion matrix is generated.


# Execution
Lets get down to business.

**Setup**
1. Run `init.sh`
2. In the todomvc folder run `git apply ../todomvc.diff`

## Step 1. Normalize all scripts that will be tested 
This step will create a normalized version of the application:
no inline scripts, no externally hosted scripts.

`node todomvc_lacuna_normalizer.js`

Creates the examples.normalized

## Step 2. Acquire the Lacuna analyzer results
Requires renaming of examples.normalized to examples.lacunized
`todomvc_run.sh`
This function runs very slow as it does every evaluation many more times than
necessary.

use `node todomvc_lacuna2.js` which only runs lacuna once for every analyzer 
framework combination.

-- Note this doesn't work for now.
`node todomvc_lacuna.js` 
can create examples.lacunized should enable createDestinationFolder().

## Step 3. Getting the ground truth values [OPTIONAL]
Creates examples.lacunized.instrumented
`node todomvc_instrumenter.js`

_This step is optional as it only needs to be ran once_
Fetch _all_functions.txt by running the instrumenter

Get _alive_functions by running the following commands in the todomvc folder:
`gulp test-server`
in test folder
`npm run test`

(May require you to rename the example.lacunized.instrumented to examples)


## Step 4.
Modify getStatistics.js to have the examples folders point to the good directory.
A different directory can be chosen for the ground truth values and the Lacuna values.

After an examples folder is there that contains all the log files, 
all_functions, alive_functions, 

Run `node getStatistics.js` which will create the logs and the statistics
folder

## Step 5. 
When all stats are there, compute the averages with `node getAvgStatistics.js`