var {ToggleButton} = require('sdk/ui/button/toggle');
var pageWorkers = require("sdk/page-worker");
var panels = require("sdk/panel");
var self = require("sdk/self");
var tabs = require("sdk/tabs");

var allDatastoreTabs = {};
var allTabCount = 0;

var button = ToggleButton({
    id: "my-button",
    label: "my button",
    icon: {
        "16": "./img/icon-16.png",
        "32": "./img/icon-32.png",
        "64": "./img/icon-64.png"
    },
    onChange: handleChange
});

var panel = panels.Panel({
    contentURL: self.data.url("main.html"),
    onHide: handleHide,
    height: 250
});

var onLogin = function (data) {
    console.log("index.js login");
    panel.port.emit('login', null);
    for (var count in allDatastoreTabs) {
        if (allDatastoreTabs.hasOwnProperty(count)) {
            allDatastoreTabs[count].port.emit('login', null);
        }
    }
};

var onLogout = function (data) {
    console.log("index.js logout");
    panel.port.emit('logout', null);
    for (var count in allDatastoreTabs) {
        if (allDatastoreTabs.hasOwnProperty(count)) {
            allDatastoreTabs[count].port.emit('logout', null);
        }
    }
};

panel.port.on('resize', function (data) {
    panel.resize((data.width), (data.height));
});

panel.port.on('login', onLogin);
panel.port.on('logout', onLogout);


panel.port.on('openTab', function (data) {

    var tab = {
        url: "resource://sansopw" + data.url
    };

    if (data.url === '/data/datastore.html') {
        tab.onReady = function(tab) {
            var worker = tab.attach({
                contentScriptFile: "./content-script.js",
                onmessage: function (msg) {console.log("worker received " + msg)}
            });
            worker.port.on('login', onLogin);
            worker.port.on('logout', onLogout);
            worker.port.on('testmsg', function (data) {console.log("received test message")});

            tab.worker_id = allTabCount;
            allDatastoreTabs[allTabCount] = worker;
            allTabCount++
        };
        tab.onClose = function(tab) {
            delete allDatastoreTabs[tab.worker_id];
        };

    }
    tabs.open(tab);
});

function handleChange(state) {
    if (state.checked) {
        panel.show({
            position: button
        });
    }
}

function handleHide() {
    button.state('window', {checked: false});
}

//var lokijs = require("./data/js/lib/lokijs.min.js");
//var db = new lokijs.loki("password_manager_local_storage");
//var config = db.getCollection('config') || db.addCollection('config');
/*
panel.port.on('lokijs_config_insert', function (data) {
    config.insert(data.items);
});

panel.port.on('lokijs_config_data', function (data) {
    config.insert(data.items);
});
*/