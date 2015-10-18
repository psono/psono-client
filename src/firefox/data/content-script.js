// content-script.js

self.port.on("loggedIn", handleMessage);

var handleMessage = function (message) {

    console.log('content-script.js received login');
    console.log(message);

    //alert(message);
    //
};

self.port.on("loggedOut", handleMessage2);

var handleMessage2 = function (message) {

    console.log('content-script.js received logout');
    console.log(message);

    //alert(message);
    //self.port.emit("my-script-response", "Response from content script");
};

self.port.emit("testmsg", "test");