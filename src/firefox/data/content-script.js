// content-script.js


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
