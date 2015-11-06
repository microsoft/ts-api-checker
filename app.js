/// <reference path="types/tsd" />
var path = require("path");
var fs = require("fs");
var program = require("commander");
var utils = require("./server/utils");
var compile = require("./server/compile");
var checker = require("./server/checker");
var ApiChecker = (function () {
    function ApiChecker() {
        program
            .option("-b, --baseline [path]", "Specify baseline file")
            .option("-c, --compared [path]", "Specify compared file")
            .option("-v, --verbose", "Display log")
            .option("-e, --exemptedAnnotation [annotation]", "Annotation for exempted apis (default: exemptedapi)")
            .option("-f, --filter [types]", "Types to filter")
            .parse(process.argv);
        var p = program;
        this._baseline = p.baseline;
        if (!this._baseline) {
            utils.throwError("Specify baseline declare file.");
        }
        if (!fs.existsSync(this._baseline)) {
            utils.throwError("Baseline declare does not exist: " + this._baseline);
        }
        this._compared = p.compared;
        if (!this._compared) {
            utils.throwError("Specify compared declare file.");
        }
        if (!fs.existsSync(this._compared)) {
            utils.throwError("Compared declare does not exist: " + this._compared);
        }
        if (p.verbose) {
            utils.setVerbosity(true);
        }
        if (p.exemptedAnnotation) {
            checker.setExemptedAnnotation(p.exemptedAnnotation);
        }
    }
    ApiChecker.prototype._readMetadata = function (filepath, useExisting) {
        if (useExisting === void 0) { useExisting = false; }
        var filename = path.basename(filepath, ".ts");
        var dirname = path.dirname(filepath);
        var metadataPath = path.join(dirname, filename + ".d.json");
        utils.consoleLog("metadata path:" + metadataPath);
        if (!useExisting || !fs.existsSync(metadataPath)) {
            // compile
            compile.TsReflect.compile([filepath], dirname);
        }
        return JSON.parse(fs.readFileSync(metadataPath, "UTF8"));
    };
    ApiChecker.prototype.check = function () {
        var baselineMetadata = this._readMetadata(this._baseline, true);
        baselineMetadata.kind = "module";
        baselineMetadata.name = "_global_";
        var comparedMetadata = this._readMetadata(this._compared, true);
        comparedMetadata.kind = "module";
        comparedMetadata.name = "_global_";
        // Store compared types first	
        checker.storeTypes(comparedMetadata, "");
        // Check baseline types against compared
        checker.checkTypes(baselineMetadata, "");
    };
    return ApiChecker;
})();
var apiChecker = new ApiChecker();
apiChecker.check();
