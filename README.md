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

## Step 1. Acquiring the ground truth values


## Step 2. Running Lacuna on the projects

