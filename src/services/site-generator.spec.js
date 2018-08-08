"use strict";

const chai = require("chai");
chai.use(require("chai-json-schema"));
const expect = chai.expect;
const { each } = require("lodash");
const fs = require("fs");
const util = require("util");
const stat = util.promisify(fs.stat);
const shell = require("shelljs");

const { buildDataTree, buildIndex } = require("./data-service");

const SiteGenerator = require("./site-generator");

describe.only("test static site generation capability", () => {
    if (!process.env.DATA_PATH) {
        console.log("Please set DATA_PATH in the environment. It needs to");
        console.log("  point to the location of the datafiles to be loaded.");
        process.exit();
    }

    if (!process.env.STATIC_SITE_PATH) {
        console.log(
            "Please set STATIC_SITE_PATH in the environment. It needs to"
        );
        console.log("  point to the location where the site is to be created.");
        process.exit();
    }
    it("should be able to create a static site", async () => {
        let { items, errors } = await buildDataTree(process.env.DATA_PATH);
        const loggers = {
            logInfo: () => {},
            logError: () => {},
            logComplete: () => {}
        };
        let index = buildIndex({ items, loggers });
        const siteGenerator = new SiteGenerator({
            data: index,
            siteLocation: process.env.STATIC_SITE_PATH,
            loggers
        });
        siteGenerator.generate();

        index.forEach(async item => {
            const path = `${process.env.STATIC_SITE_PATH}/${
                item.collectionId
            }/${item.itemId}`;
            expect((await stat(path)).isDirectory()).to.be.true;
            ["files", "information", "images", "media", "documents"].forEach(
                async component => {
                    expect((await stat(`${path}/${component}`)).isDirectory())
                        .to.be.true;
                }
            );
        });

        // console.log(siteGenerator.data);
    });
});
