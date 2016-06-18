var {ToggleButton} = require('sdk/ui/button/toggle');
var panels = require("sdk/panel");
var self = require("sdk/self");
var tabs = require("sdk/tabs");
var mod = require("sdk/page-mod");
var contextMenu = require("sdk/context-menu");
var uuidGenerator = require('sdk/util/uuid');
var clipboard = require("sdk/clipboard");

/////////////////////////
// Common variables
/////////////////////////

var allDatastoreTabs = {};
var allPagesByTabID = {};
var allTabCount = 0;
var fillpassword = [];

var receivers = {
    "website-password-refresh": {},
    "request-secret": {}
};

/////////////////////////
// Panel
/////////////////////////

var panel = panels.Panel({
    contentURL: self.data.url("main.html"),
    onHide: handleHide,
    height: 250
});



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
panel.port.on('login', function(data) {
    onLogin("panel", data);
});

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
panel.port.on('logout', function(data) {
    onLogout("panel", data);
});

panel.port.on('fillpassword-active-tab', function(data) {
    allPagesByTabID[tabs.activeTab.id].port.emit('fillpassword', data);
});
function handleHide() {
    button.state('window', {checked: false});
}

panel.port.on('resize', function (data) {
    panel.resize((data.width), (data.height));
});

/**
 * Opens a tab
 * @param data
 */
var openTab = function (data) {

    var tab = {
        url: "resource://sansopw" + data.url
    };

    tabs.open(tab);
};
panel.port.on('openTab', openTab);


var onFillpassword = function (data) {
    fillpassword.push(data);
};
panel.port.on('fillpassword', onFillpassword);


/**
 * filters the leafs for a given url and returns the leafs to the panel for search
 *
 * @param payload
 */
var on_storage_get_item = function(payload) {

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
};
panel.port.on('storage-getItem', on_storage_get_item);

/**
 * returns the url of the active tab
 */
var on_get_active_tab_url = function() {
    panel.port.emit('get-active-tab-url', {data: tabs.activeTab.url});
};
panel.port.on('get-active-tab-url', on_get_active_tab_url);

/**
 * forwards the decrypted secret to the sender
 *
 * @param payload
 */
var on_secret_get_item = function(payload) {

    payload = JSON.parse( payload );

    var request_secret = function (payload) {

        receivers["request-secret"][payload.id].worker.port.emit("return-secret", JSON.parse( payload.data ));

        delete receivers["request-secret"][payload.id];
    };

    if (receivers["request-secret"].hasOwnProperty(payload.id)) {
        return request_secret(payload);
    }
};
panel.port.on('secret-getItem', on_secret_get_item);

/**
 * updates the clipboard
 *
 * @param payload
 */
var on_copy_to_clipboard = function(payload) {

    payload = JSON.parse( payload );

    clipboard.set(payload.data.text);
};
panel.port.on('copy-to-clipboard', on_copy_to_clipboard);

/////////////////////////
// Panel Button
/////////////////////////

function handleChange(state) {
    if (state.checked) {
        panel.show({
            position: button
        });
    }
}

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




/////////////////////////
// Context menu
/////////////////////////

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

/////////////////////////
// Plugin pages
/////////////////////////

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
        "./js/lib/ecma-nacl.js",
        "./js/lib/sha512.js",
        "./js/lib/sha256.js",
        //"./js/lib/nacl_factory.js",
        "./js/lib/scrypt.js",
        "./js/lib/uuid.js",
        "./js/lib/jquery-2.1.4.js",
        "./js/lib/jquery.dataTables.min.js",
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
        "./js/lib/ngdraggable.js",
        "./js/lib/angular-tree-view.js",
        "./js/lib/angular-ui-select.js",
        "./js/lib/ng-context-menu.js",
        "./js/lib/angular-dashboard-framework.js",
        "./js/lib/angular-datatables.js",
        "./js/widgets/adf-widget-datastore.js",
        "./js/widgets/adf-widget-shareusers.js",
        "./js/widgets/adf-widget-accept-share.js",
        "./js/main.js",
        "./js/widgets/adf-dashboard-controller.js",
        "./js/service/api-client.js",
        "./js/service/helper.js",
        "./js/service/message.js",
        "./js/service/item-blueprint.js",
        "./js/service/share-blueprint.js",
        "./js/service/crypto-library.js",
        "./js/service/storage.js",
        "./js/service/settings.js",
        "./js/service/manager-base.js",
        "./js/service/manager.js",
        "./js/service/manager-adf-widget.js",
        "./js/service/manager-datastore.js",
        "./js/service/manager-link.js",
        "./js/service/manager-secret.js",
        "./js/service/manager-share.js",
        "./js/service/manager-datastore-password.js",
        "./js/service/manager-datastore-user.js",
        "./js/service/manager-datastore-setting.js",
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

        worker.port.on('fillpassword', onFillpassword);

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

/////////////////////////
// Content Script
/////////////////////////

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
        /**
         * triggered by the 'ready' event, once a content script finishes loading on a website
         *
         * @param url
         */
        var on_ready = function (url) {

            var parsed_url = parse_url(url);

            for(var i = fillpassword.length - 1; i >= 0; i--) {
                if( endsWith(parsed_url.authority, fillpassword[i].authority)) {

                    fillpassword[i].submit = parsed_url.scheme == 'https';
                    worker.port.emit("fillpassword", fillpassword[i]);
                    fillpassword.splice(i, 1);
                    break;
                }
            }
        };
        worker.port.on("ready", on_ready);

        /**
         * triggered by the 'website-password-refresh' event, once a content scripts wants to received the possible
         * secret ids, based on the url filter
         *
         * @param url
         */
        var on_website_password_refresh = function (url) {

            var parsed_url = parse_url(url);

            var uuid = uuidGenerator.uuid().toString().substring(1, 37); //why are there stupid brackets around the uuid

            receivers["website-password-refresh"][uuid] = {
                worker: worker,
                parsed_url: parsed_url
            };

            panel.port.emit('storage-getItem', {id: uuid, data: 'datastore-password-leafs'});
        };
        worker.port.on("website-password-refresh", on_website_password_refresh);

        /**
         * triggered by the 'secret-getItem' event, once a content script wants to have a decrypted secret
         *
         * @param data
         */
        var on_request_secret = function (data) {

            var parsed_url = parse_url(data.url);

            var uuid = uuidGenerator.uuid().toString().substring(1, 37); //why are there stupid brackets around the uuid

            receivers["request-secret"][uuid] = {
                worker: worker,
                parsed_url: parsed_url,
                secret_id : data.secret_id
            };

            panel.port.emit('secret-getItem', {id: uuid, data: data.secret_id});
        };
        worker.port.on("request-secret", on_request_secret);

        allPagesByTabID[worker.tab.id] = worker;
    }
});

/////////////////////////
// Start helper functions
/////////////////////////

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