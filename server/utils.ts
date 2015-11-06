/// <reference path="../types/tsd" />
var verbose = false;

export function throwError(message: string, showHelp: boolean = false): void {
    console.error(message);
    process.exit(1);
}

export function throwCompatError(message: string): void {
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
