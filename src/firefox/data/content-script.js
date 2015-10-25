// content-script.js

self.port.on("login", function (message) {

    console.log('content-script.js received login');
    console.log(message);

    //alert(message);
    //
});

self.port.on("logout", function (message) {

    console.log('content-script.js received logout');
    console.log(message);

    //alert(message);
    //self.port.emit("my-script-response", "Response from content script");
});

self.port.emit("testmsg", "test");


/* WIll listen for events from tabs and relay them to the main script */
window.addEventListener('login', function(event) {
    console.log('content-script.js on login');
    self.port.emit("login", event);
}, false);

window.addEventListener('logout', function(event) {
    console.log('content-script.js on logout');
    self.port.emit("login", event);
}, false);
