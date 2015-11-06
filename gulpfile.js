var gulp = require("gulp");
var ts = require("gulp-typescript");
var rename = require("gulp-rename");

// Compile server typescript files
gulp.task("compile-server", function () {
    var tsResult = gulp.src(["./app.ts", "./server/**/*.ts"]).pipe(ts({
        module: "commonjs",
        noImplicitAny: true,
        typescript: require("typescript")
    }));

    return tsResult.js.pipe(rename(function (path) {
        if (path.basename !== "app") {
            if (path.dirname === ".") {
                path.dirname += "/server";
            } else {
                path.dirname = "./server/" + path.dirname;
            }
        } else { }
    })).pipe(gulp.dest("."));
});

// Compile client typescript files
gulp.task("compile-client", ["compile-server"], function () {
    var tsResult = gulp.src("./client/**/*.ts").pipe(ts({
        module: "amd",
        typescript: require("typescript")
    }));

    return tsResult.js.pipe(rename(function (path) {
        if (path.dirname === ".") {
            path.dirname += "/content/js/app";
        } else {
            path.dirname = "./content/js/app/" + path.dirname;
        }
    })).pipe(gulp.dest("."));
});

// Compile all typescript files
gulp.task("ts-compile", ["compile-client"]);

// Watch any typescript file changes and compile
gulp.task("ts-watch", function () {
    gulp.watch("**/*.ts", ["ts-compile"]);
});

// Default task
gulp.task("default", ["ts-compile"]);