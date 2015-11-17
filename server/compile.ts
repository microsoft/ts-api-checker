/// <reference path="../types/tsd" />

import fs = require("fs");
import path = require("path");
import tsreflect = require("tsreflect-compiler");

import utils = require("./utils");

export class TsReflect {
    public static compile(inputFiles: string[]): void {
        utils.consoleLog(`Compiling sources..(${inputFiles.length} ts files)`);
        
        // Compile using tsreflect-compiler
        var diagnostics = tsreflect.compile(inputFiles, <any>{
            target: 1,
            module: 2
        });

        // Dump issues to console
        this._reportIssues(diagnostics);
        utils.consoleLog("Compiling finished.");
    }

    private static _reportIssues(compileIssues: tsreflect.Diagnostic[]): void {
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

            utils.consoleLog(`${compileIssues.length} issues found`);
        }
    }

    private static _buildMessage(issue: tsreflect.Diagnostic): string {
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
    }
}