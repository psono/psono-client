(function() {
    var report_url = '';

    if (window.location.href.indexOf('https://www.psono.pw') !== -1) {
        report_url = 'https://d9647cf54f0a46d68289c85b77fbca11@sentry.io/1265628';
    } else if (window.location.href.indexOf('chrome-extension://eljmjmgjkbmpmfljlmklcfineebidmlo') !== -1) {
        report_url = 'https://587b29076fa84bc4b57cf447b949f880@sentry.io/1265636';
    } else if (window.location.href.indexOf('moz-extension://47807566-6bb5-44b3-8436-c77e0fdd15c8') !== -1) {
        report_url = 'https://5f58b21bec7c499aa8950b0b646405c8@sentry.io/1265640';
    }

    if (report_url) {
        console.log("Raven enabled.");
        Raven.config(report_url).install();
    }
})();
