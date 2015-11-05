/// <reference path="types/tsd" />

import path = require("path");
import fs = require("fs");
import program = require("commander");

import utils = require("./server/utils");
import compile = require("./server/compile");
import checker = require("./server/checker");

class ApiChecker {
	private _baseline: string;
	private _compared: string;

	constructor() {
		
		program
			.option("-b, --baseline [path]", "Specify baseline file")
			.option("-c, --compared [path]", "Specify compared file")
			.option("-v, --verbose", "Display log")
			.option("-f, --filter [types]", "Types to filter")
			.parse(process.argv);
			
		var p = <any>program;
        this._baseline = p.baseline;
        if (!this._baseline) {
			utils.throwError("Specify baseline declare file.");
        }

		if (!fs.existsSync(this._baseline)) {
			utils.throwError(`Baseline declare does not exist: ${this._baseline}`);
		}

		this._compared = p.compared;
        if (!this._compared) {
			utils.throwError("Specify compared declare file.");
        }

		if (!fs.existsSync(this._compared)) {
			utils.throwError(`Compared declare does not exist: ${this._compared}`);
		}

		if(p.verbose) {
			utils.setVerbosity(true);
		}
	}

	private _readMetadata(filepath: string, useExisting: boolean = false): any {
		var filename = path.basename(filepath, ".ts");
		var dirname = path.dirname(filepath);
		var metadataPath = path.join(dirname, filename + ".d.json");
		utils.consoleLog("metadata path:" + metadataPath);
		if (!useExisting || !fs.existsSync(metadataPath)) {
			// compile
			compile.TsReflect.compile([filepath], dirname);
		}

		return JSON.parse(fs.readFileSync(metadataPath, "UTF8"));
	}

	public check(): void {
		var baselineMetadata = this._readMetadata(this._baseline, true);
		baselineMetadata.kind = "module";
		baselineMetadata.name = "global";

		var comparedMetadata = this._readMetadata(this._compared);
		comparedMetadata.kind = "module";
		comparedMetadata.name = "global";
	
		// Store compared types first	
		checker.storeTypes(comparedMetadata, "");
		
		// Check baseline types against compared
		checker.checkTypes(baselineMetadata); 
	}
}

var apiChecker = new ApiChecker();
apiChecker.check();
