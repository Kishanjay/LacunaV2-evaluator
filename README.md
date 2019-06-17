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

## Step 2. Acquire the Lacuna analyzer results
`node todomvc_lacuna.js`
`todomvc_run.sh`


## Step 3. Getting the ground truth values
Fetch _all_functions.txt by running the instrumenter

Get _alive_functions by running the following commands in the todomvc folder:
`gulp test-server`
in test folder
`npm run test`

(May require you to rename the example.lacunized.instrumented to examples)
