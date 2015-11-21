"use strict";

var bg = (function () {

    var time = 0;

    setInterval(myTimer, 1000);

    function myTimer() {
        time +=1;
    }


    var test = function () {
        return time;
    };

    return {
        time: time,
        test: test
    }
})();

var db = new loki("password_manager_local_storage");
var config = db.getCollection('config') || db.addCollection('config');



/*
 * Dummy context menu
 */
function onClick(info, tab) {
    console.log(JSON.stringify(info));
    console.log(JSON.stringify(tab));
}

var contexts = [
    "page"
];

for (var i = 0; i < contexts.length; i++) {
    var context = contexts[i];
    var title = "My menuitem";
    var id = chrome.contextMenus.create({"title": title, "contexts":[context], "onclick": onClick});
}


// Create a parent item and two children.
var parent = chrome.contextMenus.create({"title": "My parent"});
var child1 = chrome.contextMenus.create(
    {"title": "My child 1", "parentId": parent, "onclick": onClick});
var child2 = chrome.contextMenus.create(
    {"title": "My child 2", "parentId": parent, "onclick": onClick});
