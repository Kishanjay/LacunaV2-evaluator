/**
 * A set of functions that will (hopefully) trigger all accessible functions of 
 * the todomvc 
 * 
 * Unfortunately, actually simulating keyboard input seems to be hard this way
 */
console.log("Running testcases");

const enter = new KeyboardEvent("keypress", {
    view: window,
    keyCode: 13,
    bubbles: true,
    cancelable: true
});

const dblClick = new MouseEvent('dblclick', {
    'view': window,
    'bubbles': true,
    'cancelable': true
});

var a = new KeyboardEvent('keydown', {'keyCode':65, 'which':65});


// TAB 1
addTodo("item1"); // add
addTodo("item2"); // add  n+1
deleteTodo(0); // delete 
addTodo("item4"); // add +delete
addTodo("item5"); // add +delete+1
deleteTodo(1); // delete n+1
markTodo(0); // add mark
markTodo(1); // add mark n+1
markTodo(0); // remove mark

// TAB 2
switchTab(1); // switch to active
addTodo("item8"); // add item while active
markTodo(2); // mark while active
markTodo(2); // remove mark while active
markTodo(0);

// TAB 3
switchTab(3); // switch to complete
markTodo(0); // unmark
markTodo(0); // unmark
addTodo("item10");

clearCompleted();
switchTab(0);
markAll();
clearCompleted();

// Others
addTodo("alpha")
addTodo("beta")
addTodo("gamma")
markAll();
markAll();
switchTab(1);

// Click
switchTab(0);
doubleClick(0);
send(a);


function send(ev) {
    document.dispatchEvent(ev);
}
function doubleClick(index) {
    try {
        document.querySelector(".todo-list").querySelectorAll("label")[index].dispatchEvent(dblClick);
    } catch (error) { console.log(error); }
}
function clearCompleted() {
    try {
        document.querySelector("#clear-completed").click();
    } catch (error) { console.log(error); }  
}

function markAll() {
    try {
        document.querySelector("#toggle-all").click();
    } catch (error) { console.log(error); }
}
function markTodo(index) {
    try {
        var todoMarkers = document.querySelector("#todo-list").querySelectorAll("input[type=checkbox]");
        todoMarkers[index].click();
    } catch (error) { console.log(error); }  
}
function addTodo(name) {
    try {
        var newTodo = document.querySelector("#new-todo");
        newTodo.value = "item1";
        newTodo.dispatchEvent(enter);
    } catch (error) { console.log(error); }   
}

function deleteTodo(index) {
    try {
        var destroyEles = document.querySelectorAll(".destroy");
        destroyEles[index].click();
    } catch (error) { console.log(error); }   
}
function switchTab(index) {
    try {
        var tabs = document.querySelector("#filters").querySelectorAll("a");
        switch (index) {
            case 0: // all
                tabs[0].click();
                break;
            case 1: // active
                tabs[1].click();
                break;
            case 2: // completed
                tabs[2].click();
                break;
        }
    } catch (error) { console.log(error); }  
}


