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