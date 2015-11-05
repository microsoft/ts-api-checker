/// <reference path="../types/tsd" />

var verbose = false;

export function throwError(message: string): void {
	console.error(message);
	process.exit(1);
}

export function setVerbosity(v: boolean): void {
	verbose = v;
}

export function consoleLog(message: string): void {
	if (verbose) {
		console.log(message);
	}
}