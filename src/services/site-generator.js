"use strict";

const util = require("util");
const fs = require("fs");
const shelljs = require("shelljs");
const ejs = require("ejs");
const ejsRenderFile = util.promisify(ejs.renderFile);

class SiteGenerator {
    constructor({ data, siteLocation }) {
        this.data = data;
        this.siteLocation = siteLocation;
    }

    generate() {
        this.data.forEach(async item => {
            await this.setupSite({ item });
            await this.createInformationPage({ item });
        });
    }

    setupSite({ item }) {
        const path = `${this.siteLocation}/${item.collectionId}/${item.itemId}`;
        shelljs.mkdir("-p", path);
        [
            "assets",
            "files",
            "information",
            "images",
            "media",
            "transcriptions",
            "documents"
        ].forEach(component => {
            shelljs.mkdir("-p", `${path}/${component}`);
        });
    }

    async createInformationPage({ item }) {
        let template = `${__dirname}/templates/information.ejs`;
        const html = await ejsRenderFile(template, {}, { async: false });
        console.log("****", html);
    }
}

module.exports = SiteGenerator;
