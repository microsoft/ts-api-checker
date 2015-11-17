/// <reference path="../types/tsd" />
var verbose = false;

export function throwError(message: string, showHelp: boolean = false): void {
    console.error(message);
    process.exit(1);
}

export function throwCompatError(key: string): void {
    var keyParts = key.split('**');
    var names = keyParts.map((pair: string) => {
        return pair.split('::');
    });

    var message: string;
    var notFoundText: string;
    var notFoundItem = names[keyParts.length - 1];
    if (notFoundItem.length > 1) {
        notFoundText = `${notFoundItem[0].toUpperCase() } ${notFoundItem[1]}`;
    } else {
        notFoundText = notFoundItem[0];
    }

    if (names.length > 3) {
        var parentTexts: string[] = [];
        for (var i = 2; i < names.length - 1; i++) {
            var parent = names[i];
            parentTexts.push(parent[parent.length - 1]);
        }

        message = `${notFoundText} cannot be found in ${parentTexts.join('/')}.`;
    } else {
        message = `${notFoundText} cannot be found.`;
    }

    throwError(`${message} This will break compatibility for API consumers.`);
}

export function setVerbosity(v: boolean): void {
    verbose = v;
}

export function consoleLog(message: string): void {
    if (verbose) {
        console.log(message);
    }
}
