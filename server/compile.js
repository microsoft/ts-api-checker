/// <reference path="../types/tsd" />
var tsreflect = require("tsreflect-compiler");
var utils = require("./utils");
var TsReflect = (function () {
    function TsReflect() {
    }
    TsReflect.compile = function (inputFiles, outputPath) {
        utils.consoleLog("Compiling sources..(" + inputFiles.length + " ts files), output: " + outputPath);
        // Compile using tsreflect-compiler
        var diagnostics = tsreflect.compile(inputFiles, {
            outDir: outputPath,
            ignoreAnnotation: {
                "returns": true,
                "return": true,
                "param": true,
                "notes": true
            }
        });
        // Dump issues to console
        this._reportIssues(diagnostics);
        utils.consoleLog("Compiling finished.");
    };
    TsReflect._reportIssues = function (compileIssues) {
        if (compileIssues.length > 0) {
            for (var i = 0; i < compileIssues.length; i++) {
                var diag = compileIssues[i];
                switch (diag.category) {
                    case tsreflect.DiagnosticCategory.Message:
                        utils.consoleLog(this._buildMessage(compileIssues[i]));
                        break;
                    case tsreflect.DiagnosticCategory.Warning:
                        utils.consoleLog(this._buildMessage(compileIssues[i]));
                        break;
                    case tsreflect.DiagnosticCategory.Error:
                        utils.consoleLog(this._buildMessage(compileIssues[i]));
                        break;
                }
            }
            utils.consoleLog(compileIssues.length + " issues found");
        }
    };
    TsReflect._buildMessage = function (issue) {
        var message = "";
        if (issue.filename) {
            message += issue.filename;
            if (issue.line) {
                message += " (line " + issue.line + ")";
            }
            message += ": ";
        }
        message += issue.messageText;
        return message;
    };
    return TsReflect;
})();
exports.TsReflect = TsReflect;
