"use strict";

const util = require("util");
const fs = require("fs");
const shelljs = require("shelljs");
const ejs = require("ejs");
const nunjucks = require("nunjucks");

class SiteGenerator {
    constructor({ data, siteLocation }) {
        this.data = data;
        this.siteLocation = siteLocation;
    }

    generate() {
        this.data.forEach(async item => {
            item.path = `${this.siteLocation}/${item.collectionId}/${
                item.itemId
            }`;
            await this.setupSite({ item });
            await this.createInformationPage({ item });
        });
    }

    setupSite({ item }) {
        shelljs.mkdir("-p", item.path);
        [
            "assets",
            "files",
            "information",
            "images",
            "media",
            "transcriptions",
            "documents"
        ].forEach(component => {
            shelljs.mkdir("-p", `${item.path}/${component}`);
        });
        shelljs.cp(
            `${__dirname}/../../node_modules/bootstrap/dist/css/bootstrap.min.css`,
            `${item.path}/assets/`
        );
    }

    async createInformationPage({ item }) {
        const file = `${item.path}/information/index.html`;
        const template = `${__dirname}/templates/information.njk`;
        console.log(item);
        const html = nunjucks.render(template, item);
        fs.writeFileSync(file, html);
    }
}

module.exports = SiteGenerator;
