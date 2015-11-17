/// <reference path="../types/tsd" />
var verbose = false;
function throwError(message, showHelp) {
    if (showHelp === void 0) { showHelp = false; }
    console.error(message);
    process.exit(1);
}
exports.throwError = throwError;
function throwCompatError(key) {
    var keyParts = key.split('**');
    var names = keyParts.map(function (pair) {
        return pair.split('::');
    });
    var message;
    var notFoundText;
    var notFoundItem = names[keyParts.length - 1];
    if (notFoundItem.length > 1) {
        notFoundText = notFoundItem[0].toUpperCase() + " " + notFoundItem[1];
    }
    else {
        notFoundText = notFoundItem[0];
    }
    if (names.length > 3) {
        var parentTexts = [];
        for (var i = 2; i < names.length - 1; i++) {
            var parent = names[i];
            parentTexts.push(parent[parent.length - 1]);
        }
        message = notFoundText + " cannot be found in " + parentTexts.join('/') + ".";
    }
    else {
        message = notFoundText + " cannot be found.";
    }
    throwError(message + " This will break compatibility for API consumers.");
}
exports.throwCompatError = throwCompatError;
function setVerbosity(v) {
    verbose = v;
}
exports.setVerbosity = setVerbosity;
function consoleLog(message) {
    if (verbose) {
        console.log(message);
    }
}
exports.consoleLog = consoleLog;
