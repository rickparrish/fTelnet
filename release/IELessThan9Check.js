// IE less than 9.0 will throw script errors and not even load
if (navigator.appName === 'Microsoft Internet Explorer') {
    var Version = -1;
    var RE = new RegExp('MSIE ([0-9]{1,}[\\.0-9]{0,})');
    if (RE.exec(navigator.userAgent) !== null) { Version = parseFloat(RegExp.$1); }
    if (Version < 9.0) {
        Object.defineProperty = function () { /* Do Nothing */ };
    }
}
