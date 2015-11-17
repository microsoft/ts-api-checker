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

        console.log("Checking TypeScript API compatibility...");
        
        program
            .option("-b, --baseline [path]", "Specify baseline file")
            .option("-c, --compared [path]", "Specify compared file")
            .option("-v, --verbose", "Display log")
            .option("-e, --exemptedAnnotation [annotation]", "Annotation for exempted apis [default: exemptedapi]")
            .option("-x, --excludedKinds [kinds]", "Kinds to exclude during check (comma separated) [default: variable, import]")
            .parse(process.argv);

        var p = <any>program;
        
        this._baseline = p.baseline;
        if (!this._baseline) {
            utils.throwError("Specify baseline file.");
        }

        if (!fs.existsSync(this._baseline)) {
            utils.throwError(`Baseline file ${this._baseline} does not exist.`);
        }

        this._compared = p.compared;
        if (!this._compared) {
            utils.throwError("Specify compared file.");
        }

        if (!fs.existsSync(this._compared)) {
            utils.throwError(`Compared file ${this._compared} does not exist.`);
        }

        if (p.verbose) {
            utils.setVerbosity(true);
        }

        if (p.exemptedAnnotation) {
            checker.setExemptedAnnotation(p.exemptedAnnotation);
        }
        
        if(p.excludedKinds) {
            checker.setExcludedKinds(p.excludedKinds);
        }
    }
    
    private readMetadata(filepath: string, useExisting: boolean = false): any {
        var filename = path.basename(filepath, ".ts");
        var dirname = path.dirname(filepath);
        var metadataPath = path.join(dirname, filename + ".json");
        
        if (!useExisting || !fs.existsSync(metadataPath)) {
            // Compile the file to extract metadata
            compile.TsReflect.compile([filepath]);
        }

        return JSON.parse(fs.readFileSync(metadataPath, "UTF8"));
    }

    public check(): void {
        var baselineMetadata = this.readMetadata(this._baseline, true);
        baselineMetadata.kind = "module";
        baselineMetadata.name = "_global_";

        var comparedMetadata = this.readMetadata(this._compared, false);
        comparedMetadata.kind = "module";
        comparedMetadata.name = "_global_";
	
        // Store compared types first	
        checker.storeTypes(comparedMetadata, "");
		
        // Check baseline types against stored types
        checker.checkTypes(baselineMetadata, "");
    }
}

var apiChecker = new ApiChecker();
apiChecker.check();
