"use strict";

const fs = require("fs-extra");
const util = require("util");
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const copy = util.promisify(fs.copyFile);
const shell = require("shelljs");
const {
    buildDataTree,
    readCatalogFile,
    buildIndex,
    prepareTarget,
    installTheData,
    writeIndexFile,
    updateLibraryBoxConfigurationFiles
} = require("../src/services/data-service");

const {
    compact,
    flattenDeep,
    includes,
    groupBy,
    map,
    each,
    isArray
} = require("lodash");

const loggers = {
    logInfo: msg => {
        console.log(msg);
    },
    logComplete: msg => {
        console.log(msg);
    },
    logError: msg => {
        console.log(msg);
    }
};

const args = require("yargs")
    .option("data-path", {
        describe: "The full path to the data folders",
        demandOption: true
    })
    .option("output-path", {
        describe: "The full path to where you want the repository created",
        demandOption: true
    })
    .option("index-type", {
        describe: "The type of index to request",
        demandOption: true,
        choices: ["id", "genre", "speaker", "speaker-genre"]
    })
    .option("speaker-roles", {
        describe: "The speaker roles to use in the index",
        demandOption: true,
        choices: ["speaker", "performer", "singer", "compiler"]
    })
    .help().argv;

run(args);
async function run(args) {
    const target = `${args["output-path"]}/repository`;
    const dataPath = args["data-path"];
    if (!shell.test("-d", target)) {
        shell.mkdir("-p", target);
    }

    try {
        console.log("Preparing the target disk.");
        prepareTarget(target);

        console.log("Processing the data to be loaded.");
        const { items, errors } = await buildDataTree(dataPath);

        console.log("Building the index.");
        let index = {
            type: args["index-type"],
            speakerRoles: args["speaker-roles"]
        };
        index = buildIndex({ items, index, loggers });

        console.log("Loading the data (this can take some time).");
        let result = await installTheData({
            dataPath: dataPath,
            target: target,
            index: index,
            loggers
        });

        console.log("Writing the index file.");
        writeIndexFile(target, result.index);

        shell.mv(`${target}`, `${target}.orig`);
        shell.mv(`${target}.orig/www/repository`, `${target}`);
    } catch (error) {
        console.log(error);
    }
}
