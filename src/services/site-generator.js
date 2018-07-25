"use strict";

const util = require("util");
const fs = require("fs");
const shelljs = require("shelljs");
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
            this.setupSite({ item });
            this.createInformationPage({ item });
            this.createFileBrowserPage({ item });
            this.createImageBrowserPage({ item });
            this.createMediaBrowserPage({ item });
            // console.log(JSON.stringify(item, null, 2));
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
        shelljs.cp(`${__dirname}/templates/styles.css`, `${item.path}/assets/`);
        shelljs.cp(
            `${__dirname}/../../node_modules/bootstrap/dist/css/bootstrap.min.css`,
            `${item.path}/assets/`
        );
        shelljs.cp(
            `${__dirname}/../../node_modules/@fortawesome/fontawesome-free/js/all.js`,
            `${item.path}/assets/fontawesome.js`
        );
    }

    createInformationPage({ item }) {
        const file = `${item.path}/information/index.html`;
        const template = `${__dirname}/templates/information.njk`;
        const html = nunjucks.render(template, item);
        fs.writeFileSync(file, html);
    }

    createFileBrowserPage({ item }) {
        const file = `${item.path}/files/index.html`;
        const template = `${__dirname}/templates/file-browser.njk`;
        const html = nunjucks.render(template, item);
        fs.writeFileSync(file, html);
    }

    createImageBrowserPage({ item }) {
        shelljs.mkdir("-p", `${item.path}/images/content`);
        for (let i = 0; i < item.data.images.length; i++) {
            let image = item.data.images[i];
            item.currentContext = {
                first:
                    i === 0
                        ? null
                        : `${item.data.images[0].split("/").pop()}.html`,
                previous:
                    i === 0
                        ? null
                        : `${item.data.images[i - 1].split("/").pop()}.html`,
                name: `./content/${image.split("/").pop()}`,
                meta: `Image ${i + 1} of ${item.data.images.length}`,
                next:
                    i === item.data.images.length - 1
                        ? null
                        : `${item.data.images[i + 1].split("/").pop()}.html`,
                last:
                    i === item.data.images.length - 1
                        ? null
                        : `${item.data.images[item.data.images.length - 1]
                              .split("/")
                              .pop()}.html`
            };
            shelljs.cp(image, `${item.path}/images/content`);
            const file = `${item.path}/images/${image.split("/").pop()}.html`;
            const template = `${__dirname}/templates/image-browser.njk`;
            const html = nunjucks.render(template, item);
            fs.writeFileSync(file, html);
        }
        item.data.thumbnails.forEach(image => {
            shelljs.cp(image, `${item.path}/images/content`);
        });
    }

    createMediaBrowserPage({ item }) {
        shelljs.mkdir("-p", `${item.path}/media/content`);
        for (let i = 0; i < item.data.media.length; i++) {
            const medium = item.data.media[i];
            item.currentContext = {
                item: medium
            };
            medium.files.forEach(file =>
                shelljs.cp(file, `${item.path}/media/content`)
            );
            const file = `${item.path}/media/${medium.name}.html`;
            const template = `${__dirname}/templates/media-browser.njk`;
            const html = nunjucks.render(template, item);
            fs.writeFileSync(file, html);
        }
    }
}

module.exports = SiteGenerator;
