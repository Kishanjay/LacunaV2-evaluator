/**
 * A set of functions that will (hopefully) trigger all accessible functions of 
 * the todomvc 
 */
console.log("Running testcases");

const enter = new KeyboardEvent("keypress", {
    view: window,
    keyCode: 13,
    bubbles: true,
    cancelable: true
});

addTodo("item1");
addTodo("item2");
addTodo("item3");
deleteTodo(0);
addTodo("item4");
addTodo("item5");
deleteTodo(1);
addTodo("item6");
addTodo("item7");
addTodo("item8");
deleteTodo(0);
switchTab(0);
switchTab(1);
switchTab(2);
switchTab(0);
markTodo(1);



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


