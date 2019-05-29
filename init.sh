# Pulls the dynamic-deadfunction-detector submodule
git submodule update --init

# Pulls the todomvc applications
git pull https://github.com/NielsGrootObbink/todomvc.git

# Runs npm install on all projects
npm --prefix ./todomvc install ./todomvc
npm --prefix ./todomvc/tests install ./todomvc/tests
npm --prefix ./dynamic-deadfunction-detector install ./dynamic-deadfunction-detector