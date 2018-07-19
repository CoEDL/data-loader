"use strict";

const shelljs = require("shelljs");

class SiteGenerator {
    constructor({ data, siteLocation }) {
        this.data = data;
        this.siteLocation = siteLocation;
    }

    generate() {
        this.data.forEach(async item => {
            await this.setupSite({ item });
        });
    }

    setupSite({ item }) {
        // console.log(item);
        const path = `${this.siteLocation}/${item.collectionId}/${item.itemId}`;
        shelljs.mkdir("-p", path);
        [
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
}

module.exports = SiteGenerator;
