var {ToggleButton} = require('sdk/ui/button/toggle');
var panels = require("sdk/panel");
var self = require("sdk/self");
var tabs = require("sdk/tabs");

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
    height: 200
});

panel.port.on('resize', function (data) {
    panel.resize((data.width), (data.height));
});

panel.port.on('openTab', function (data) {
    tabs.open("resource://sansopw" + data.url);
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
