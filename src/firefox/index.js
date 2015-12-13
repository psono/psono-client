var {ToggleButton} = require('sdk/ui/button/toggle');
var panels = require("sdk/panel");
var self = require("sdk/self");
var tabs = require("sdk/tabs");
var mod = require("sdk/page-mod");
var contextMenu = require("sdk/context-menu");
var uuidGenerator = require('sdk/util/uuid');
var clipboard = require("sdk/clipboard");


var allDatastoreTabs = {};
var allPagesByTabID = {};
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


var firstMenuItem = contextMenu.Item({
    label: "Main Menu",
    contentScript: 'self.on("click", function () {' +
    '  console.log("Item clicked!");' +
    '});',
    image: self.data.url("./img/icon-16.png")
});

var secondMenuItem = contextMenu.Menu({
    label: "Main Menu with submenus",
    items: [
        contextMenu.Item({
            label: "Submenu",
            contentScript: 'self.on("click", function () {' +
            '  console.log("Item clicked!");' +
            '});',
            image: self.data.url("./img/icon-16.png")
        })
    ],
    image: self.data.url("./img/icon-16.png")
});


/*
 * Some messaging stuff below
 */

panel.port.on('resize', function (data) {
    panel.resize((data.width), (data.height));
});

mod.PageMod({
    include: [
        self.data.url("./activate.html*"),
        self.data.url("./datastore.html*"),
        self.data.url("./main.html*"),
        self.data.url("./open-secret.html*"),
        self.data.url("./register.html*"),
        self.data.url("./test.html*")
    ],
    contentScriptFile: [
        "./js/lib/nacl_factory.js",
        "./js/lib/scrypt.js",
        "./js/lib/uuid.js",
        "./js/lib/jquery-2.1.4.js",
        "./js/lib/snap.min.js",
        "./js/lib/jquery.ui.js",
        "./js/lib/sortable.js",
        "./js/lib/lokijs.min.js",
        "./js/lib/password-generator.js",
        "./js/lib/angular.js",
        "./js/lib/angular-animate.js",
        "./js/lib/angular-complexify.js",
        "./js/lib/loading-bar.js",
        "./js/lib/angular-route.js",
        "./js/lib/angular-sanitize.js",
        "./js/lib/angular-local-storage.min.js",
        "./js/lib/angular-snap.min.js",
        "./js/lib/ui-bootstrap-tpls-0.13.4.min.js",
        "./js/lib/angular-tree-view.js",
        "./js/lib/angular-ui-select.js",
        "./js/lib/ng-context-menu.js",
        "./js/lib/angular-dashboard-framework.js",
        "./js/widgets/adf-widget-datastore.js",
        "./js/widgets/adf-widget-shareusers.js",
        "./js/main.js",
        "./js/service/api-client.js",
        "./js/service/helper.js",
        "./js/service/item-blueprint.js",
        "./js/service/crypto-library.js",
        "./js/service/storage.js",
        "./js/service/manager.js",
        "./js/service/browser-client.js",
        "./js/service/password-generator.js",
        "./view/templates.js"
    ],
    onAttach: function(worker) {

        worker.port.on('login', function(data) {
            onLogin("worker", data);
        });

        worker.port.on('login', function(data) {
            onLogout("worker", data);
        });

        worker.port.on('fillpassword', function(data) {
            onFillpassword(data);
        });

        worker.port.on('openTab', openTab);

        // new tabs get a new number
        if (typeof worker.tab.worker_id === 'undefined') {
            worker.tab.worker_id = allTabCount;
            allTabCount++
        }

        allDatastoreTabs[worker.tab.worker_id] = worker;
    }
});


tabs.on("close", function(tab) {
    if(typeof tab.worker_id !== 'undefined') {
        delete allDatastoreTabs[tab.worker_id];
    }
    delete allPagesByTabID[tab.id];
});

var openTab = function (data) {

    var tab = {
        url: "resource://sansopw" + data.url
    };

    tabs.open(tab);
};

panel.port.on('openTab', openTab);

function handleChange(state) {
    if (state.checked) {
        panel.show({
            position: button
        });
    }
}
var onLogin = function (from, data) {
    var msg = 'login';

    if (from == 'panel') {
        // message from panel, lets inform the tabs
        for (var count in allDatastoreTabs) {
            if (allDatastoreTabs.hasOwnProperty(count)) {
                allDatastoreTabs[count].port.emit(msg, msg);
            }
        }
    } else {
        panel.port.emit(msg, {id: 0, data: msg});
    }
};
var onLogout = function (from, data) {
    var msg = 'logout';

    if (from !== 'panel') {
        panel.port.emit(msg, {id: 0, data: msg});
    }

    for (var count in allDatastoreTabs) {
        if (allDatastoreTabs.hasOwnProperty(count)) {
            allDatastoreTabs[count].tab.close();
        }
    }
};



panel.port.on('login', function(data) {
    onLogin("panel", data);
});
panel.port.on('logout', function(data) {
    onLogout("panel", data);
});
panel.port.on('fillpassword-active-tab', function(data) {
    allPagesByTabID[tabs.activeTab.id].port.emit('fillpassword', data);
});
function handleHide() {
    button.state('window', {checked: false});
}

// Start helper functions

/**
 * parse an url and returns a structured object
 *
 * @param url
 * @returns {{scheme: *, authority: *, path: *, query: *, fragment: *}}
 */
function parse_url(url) {
    // According to RFC http://www.ietf.org/rfc/rfc3986.txt Appendix B
    var pattern = new RegExp("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?");
    var matches = url.match(pattern);

    return {
        scheme: matches[2],
        authority: matches[4].replace(/^(www\.)/,""), //remove leading www.
        path: matches[5],
        query: matches[7],
        fragment: matches[9]
    };
}

/**
 * checks if a string ends with a special suffix
 *
 * @param to_test
 * @param suffix
 * @returns {boolean}
 */
function endsWith (to_test, suffix) {
    return to_test.indexOf(suffix, to_test.length - suffix.length) !== -1;
}

/**
 * backups the data of fill password event
 *
 * @param data
 */
var fillpassword = [];
var onFillpassword = function (data) {
    fillpassword.push(data);
};

// End helper functions

// Actual messaging stuff
panel.port.on('fillpassword', function(payload) {
    onFillpassword(payload);
});


var receivers = {
    "website-password-refresh": {},
    "request-secret": {}
};

panel.port.on('storage-getItem', function(payload) {

    payload = JSON.parse( payload );

    var website_password_refresh = function (payload) {
        var update = [];
        var leafs = payload.data;
        for (var ii = 0; ii < leafs.length; ii++) {
            if (endsWith(receivers["website-password-refresh"][payload.id].parsed_url.authority, leafs[ii].urlfilter)) {
                update.push({
                    secret_id: leafs[ii].secret_id,
                    name: leafs[ii].name
                })
            }
        }

        receivers["website-password-refresh"][payload.id].worker.port.emit("website-password-update", update);

        delete receivers["website-password-refresh"][payload.id];
    };

    if (receivers["website-password-refresh"].hasOwnProperty(payload.id)) {
        return website_password_refresh(payload);
    }
});

panel.port.on('get-active-tab-url', function() {
    panel.port.emit('get-active-tab-url', {data: tabs.activeTab.url});
});

panel.port.on('secret-getItem', function(payload) {

    payload = JSON.parse( payload );

    var request_secret = function (payload) {

        receivers["request-secret"][payload.id].worker.port.emit("return-secret", JSON.parse( payload.data ));

        delete receivers["request-secret"][payload.id];
    };

    if (receivers["request-secret"].hasOwnProperty(payload.id)) {
        return request_secret(payload);
    }
});

panel.port.on('copy-to-clipboard', function(payload) {

    payload = JSON.parse( payload );

    clipboard.set(payload.data.text);
});



mod.PageMod({
    include: "*",

    contentStyleFile: [
        "./css/lib/cssreset-context-min.css",
        //"./css/lib/opensans.css",
        "./css/contentscript.css"
    ],
    contentScriptFile: [
        self.data.url("./js/lib/tether.js"),
        self.data.url("./js/lib/drop.js"),
        self.data.url("./js/lib/jquery-2.1.4.js"),
        self.data.url("./js/formfill-browser-client.js"),
        self.data.url("./js/formfill.js")
    ],
    onAttach: function(worker) {
        worker.port.on("ready", function (url) {

            var parsed_url = parse_url(url);

            for(var i = fillpassword.length - 1; i >= 0; i--) {
                if( endsWith(parsed_url.authority, fillpassword[i].authority)) {

                    fillpassword[i].submit = parsed_url.scheme == 'https';
                    worker.port.emit("fillpassword", fillpassword[i]);
                    fillpassword.splice(i, 1);
                    break;
                }
            }
        });

        worker.port.on("website-password-refresh", function (url) {

            var parsed_url = parse_url(url);

            var uuid = uuidGenerator.uuid().toString().substring(1, 37); //why are there stupid brackets around the uuid

            receivers["website-password-refresh"][uuid] = {
                worker: worker,
                parsed_url: parsed_url
            };

            panel.port.emit('storage-getItem', {id: uuid, data: 'datastore-password-leafs'});
        });

        worker.port.on("request-secret", function (data) {

            var parsed_url = parse_url(data.url);

            var uuid = uuidGenerator.uuid().toString().substring(1, 37); //why are there stupid brackets around the uuid

            receivers["request-secret"][uuid] = {
                worker: worker,
                parsed_url: parsed_url,
                secret_id : data.secret_id
            };

            panel.port.emit('secret-getItem', {id: uuid, data: data.secret_id});
        });
        allPagesByTabID[worker.tab.id] = worker;
    }
});