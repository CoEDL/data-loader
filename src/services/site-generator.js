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

    generate({ loggers }) {
        loggers.logInfo("Removing existing data");
        shelljs.rm("-r", `${this.siteLocation}/*`);
        loggers.logInfo("Creating index page");
        this.data.forEach(async item => {
            loggers.logInfo(`Generating ${item.collectionId}/${item.itemId}`);
            item.path = `${this.siteLocation}/${item.collectionId}/${
                item.itemId
            }`;
            loggers.logInfo(
                `Setting up data path for ${item.collectionId}/${item.itemId}`
            );
            this.setupSite({ item });
            // loggers.logInfo(
            //     `Creating information browser for ${item.collectionId}/${
            //         item.itemId
            //     }`
            // );
            // this.createInformationPage({ item });
            loggers.logInfo(
                `Creating file browser for ${item.collectionId}/${item.itemId}`
            );
            this.createFileBrowserPage({ item });
            loggers.logInfo(
                `Creating image browser for ${item.collectionId}/${item.itemId}`
            );
            this.createImageBrowserPage({ item });
            loggers.logInfo(
                `Creating media browser page ${item.collectionId}/${
                    item.itemId
                }`
            );
            this.createMediaBrowserPage({ item });
            this.createDocumentsBrowserPage({ item });
            loggers.logComplete(
                `Done generating ${item.collectionId}/${item.itemId}`
            );

            this.createFileBrowserPage({
                item
            });
            loggers.logInfo(
                `Creating file browser for ${item.collectionId}/${item.itemId}`
            );
        });
        this.createIndexPage();
    }

    createIndexPage() {
        shelljs.mkdir("-p", `${this.siteLocation}/assets`);
        shelljs.cp(
            `${__dirname}/templates/styles.css`,
            `${this.siteLocation}/assets/`
        );
        shelljs.cp(
            `${__dirname}/../../node_modules/bootstrap/dist/css/bootstrap.min.css`,
            `${this.siteLocation}/assets/`
        );
        const file = `${this.siteLocation}/index.html`;
        const template = `${__dirname}/templates/index.njk`;
        const html = nunjucks.render(template, { data: this.data });
        fs.writeFileSync(file, html);
    }

    setupSite({ item }) {
        shelljs.mkdir("-p", item.path);
        [
            "assets",
            "files",
            "information",
            "images",
            "media",
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

    createDocumentsBrowserPage({ item }) {
        shelljs.mkdir("-p", `${item.path}/documents/content`);
        item.data.documents.forEach(document => {
            shelljs.cp(document.path, `${item.path}/documents/content`);
        });
    }
}

module.exports = SiteGenerator;