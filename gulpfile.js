"use strict";

const gulp = require("gulp");
const mocha = require("gulp-mocha");

let src = {
    unitTests: ["./src/**/*.spec.js", "!src/common/node_modules/**/*.spec.js"],
    e2eTests: ["./e2e/**/*.spec.js"]
};

gulp.task("unitTestManager", unitTestManager);
gulp.task("integrationTestManager", integrationTestManager);
gulp.task("runUnitTests", runUnitTests);
gulp.task("runIntegrationTests", runIntegrationTests);
gulp.task("test", gulp.parallel("unitTestManager", "integrationTestManager"));

function unitTestManager(done) {
    return gulp.watch(src.unitTests, { ignoreInitial: true }, runUnitTests);
}

function integrationTestManager(done) {
    return gulp.watch(
        src.e2eTests,
        { ignoreInitial: true },
        runIntegrationTests
    );
}

function runUnitTests(done) {
    return gulp
        .src(src.unitTests)
        .pipe(mocha({ bail: true, exit: true }))
        .on("error", function(err) {
            console.log(err.stack);
        })
        .once("end", function() {
            done();
        });
}

function runIntegrationTests(done) {
    return gulp
        .src(src.e2eTests)
        .pipe(mocha({ bail: true, exit: true }))
        .on("error", function(err) {
            console.log(err.stack);
        })
        .once("end", function() {
            done();
        });
}
