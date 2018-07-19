"use strict";

const chai = require("chai");
chai.use(require("chai-json-schema"));
const expect = chai.expect;
const { each } = require("lodash");
const fs = require("fs");
const shell = require("shelljs");
const schema = require("./schema/item-data.schema");
const {
    buildDataTree,
    readCatalogFile,
    buildIndex,
    prepareTarget,
    installTheData,
    writeIndexFile,
    updateLibraryBoxConfigurationFiles
} = require("./data-service");
const installationTargetFolder = "/tmp/LB/LibraryBox";
const collectionViewer = "./src/viewer";

if (!process.env.DATA_PATH) {
    console.log("Please set DATA_PATH in the environment. It needs to");
    console.log("  point to the location of the datafiles to be loaded.");
    process.exit();
}

if (!process.env.LIBRARYBOX_MOUNTPOINT) {
    console.log("Please set LIBRARYBOX_MOUNTPOINT in the environment. It ");
    console.log("needs to point to the mountpoint of the LibraryBox USB disk.");
    process.exit();
}

describe("test data service methods", () => {
    afterEach(() => {
        shell.exec(`rm -rf ${installationTargetFolder}`);
    });
    it("should be able to build a tree of data files to load", async () => {
        const { items, errors } = await buildDataTree(process.env.DATA_PATH);
        // console.log(items, errors);
        expect(items).to.be.an("array");
        items.forEach(item => {
            expect(item).to.have.keys(
                "collectionId",
                "itemId",
                "dataPath",
                "dataFile"
            );
        });
    });

    it("should be able to read and convert a datafile to JSON", async () => {
        const { items, errors } = await buildDataTree(process.env.DATA_PATH);
        const data = readCatalogFile(items[0]);
        expect(data).to.be.jsonSchema(schema);
    });

    it("should be able to create an index file with all of the data", async () => {
        const { items, errors } = await buildDataTree(process.env.DATA_PATH);
        const index = buildIndex(items);
        expect(index).to.be.an("array");
        each(index, item => {
            expect(item.data).to.be.jsonSchema(schema);
        });
    });

    it("should be able to wipe a library box (fake) target", () => {
        shell.mkdir("-p", installationTargetFolder);
        prepareTarget(installationTargetFolder);
        expect(statDirectory(`${installationTargetFolder}/www`)).to.be.true;
        expect(statDirectory(`${installationTargetFolder}/www/repository`)).to
            .be.true;
    });

    it("should be able to install the collection viewer", () => {
        shell.mkdir("-p", installationTargetFolder);
        prepareTarget(installationTargetFolder);
        shell.cp(
            "-r",
            `${collectionViewer}/*`,
            `${installationTargetFolder}/www/`
        );
        const file = `${collectionViewer}/index.html`;
        statFile(file);
    });

    it("should be able to install the data and write the index file", async () => {
        shell.mkdir("-p", installationTargetFolder);
        prepareTarget(installationTargetFolder);
        let { items, errors } = await buildDataTree(process.env.DATA_PATH);
        let index = buildIndex(items);
        // console.log(index);
        const loggers = {
            logInfo: () => {},
            logError: () => {},
            logComplete: () => {}
        };
        const result = installTheData({
            dataPath: process.env.DATA_PATH,
            target: installationTargetFolder,
            index,
            loggers
        });
        index = result.index;
        each(index, item => {
            item.data.images.map(
                image =>
                    expect(statFile(`${installationTargetFolder}/www/${image}`))
                        .to.be.true
            );
            item.data.media.map(m =>
                m.files.map(
                    file =>
                        expect(
                            statFile(`${installationTargetFolder}/www/${file}`)
                        ).to.be.true
                )
            );
            item.data.transcriptions.map(
                t =>
                    expect(statFile(`${installationTargetFolder}/www/${t.url}`))
                        .to.be.true
            );
            item.data.documents.map(d => {
                expect(statFile(`${installationTargetFolder}/www/${d.url}`)).to
                    .be.true;
            });
        });
        writeIndexFile(`${installationTargetFolder}`, index);
        expect(
            statFile(`${installationTargetFolder}/www/repository/index.json`)
        ).to.be.true;
    }).timeout(10000);

    it("should be able to configure the defaults", () => {
        expect(
            statDirectory(
                `${process.env.LIBRARYBOX_MOUNTPOINT}/LibraryBox/Config`
            )
        ).to.be.true;
        updateLibraryBoxConfigurationFiles({
            target: process.env.LIBRARYBOX_MOUNTPOINT,
            hostname: "catalog.paradisec.offline",
            ssid: "PARADISEC Catalog"
        });
    });
});

function statFile(file) {
    return fs.statSync(file).isFile();
}

function statDirectory(dir) {
    return fs.statSync(dir).isDirectory();
}
