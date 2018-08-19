"use strict";

const util = require("util");
const fs = require("fs");
const shelljs = require("shelljs");
const nunjucks = require("nunjucks");
const { isEmpty, compact, groupBy, includes } = require("lodash");
const lodash = require("lodash");

class SiteGenerator {
    constructor({ data, siteLocation, loggers }) {
        this.data = data;
        this.siteLocation = siteLocation;
        this.loggers = loggers;
    }

    generate() {
        this.loggers.logInfo("Removing existing data");
        shelljs.rm("-r", `${this.siteLocation}/*`);
        this.loggers.logInfo("Creating index page");
        this.data.forEach(async item => {
            this.loggers.logInfo(
                `Generating ${item.collectionId}/${item.itemId}`
            );
            item = this.stripMissingFiles({ item });
            item.path = `${this.siteLocation}/${item.collectionId}/${
                item.itemId
            }`;
            this.loggers.logInfo(
                `Setting up data path for ${item.collectionId}/${item.itemId}`
            );
            this.setupSite({ item });
            // this.loggers.logInfo(
            //     `Creating information browser for ${item.collectionId}/${
            //         item.itemId
            //     }`
            // );
            // this.createInformationPage({ item });
            this.loggers.logInfo(
                `Creating file browser for ${item.collectionId}/${item.itemId}`
            );
            this.createFileBrowserPage({ item });
            this.loggers.logInfo(
                `Creating image browser for ${item.collectionId}/${item.itemId}`
            );
            item = this.createImageBrowserPage({ item });
            this.loggers.logInfo(
                `Creating media browser page ${item.collectionId}/${
                    item.itemId
                }`
            );
            this.createMediaBrowserPage({ item });
            this.createDocumentsBrowserPage({ item });
            this.loggers.logComplete(
                `Done generating ${item.collectionId}/${item.itemId}`
            );

            this.createFileBrowserPage({ item });
            this.loggers.logInfo(
                `Creating file browser for ${item.collectionId}/${item.itemId}`
            );
            console.log("");
        });

        this.createIndexPage({ data: this.data });
    }

    stripMissingFiles({ item }) {
        item.data.images = compact(
            item.data.images.map(image => {
                if (shelljs.test("-e", image)) return image;
                this.loggers.logError(
                    `${item.collectionId} / ${
                        item.itemId
                    } missing file: ${image}`
                );
            })
        );
        item.data.media = compact(
            item.data.media.map(m => {
                m.files = compact(
                    m.files.map(file => {
                        if (shelljs.test("-e", file)) return file;
                        this.loggers.logError(
                            `${item.collectionId} / ${
                                item.itemId
                            } missing file: ${file}`
                        );
                    })
                );
                if (!isEmpty(m.files)) return m;
            })
        );
        item.data.documents = compact(
            item.data.documents.map(document => {
                if (shelljs.test("-e", document.path)) return document;
                this.loggers.logError(
                    `${item.collectionId} / ${item.itemId} missing file: ${
                        document.path
                    }`
                );
            })
        );
        return item;
    }

    createIndexPage({ data }) {
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
        data = {
            byIdentifier: groupByIdentifier(data),
            byGenre: groupByGenre(data),
            bySpeaker: groupBySpeaker(data)
        };
        const html = nunjucks.render(template, { data });
        fs.writeFileSync(file, html);

        function groupByIdentifier(data) {
            let collections = groupBy(data, "collectionId");
            var ordered = {};
            lodash(collections)
                .keys()
                .sort()
                .each(function(key) {
                    ordered[key] = collections[key];
                });

            return ordered;
        }

        function groupByGenre(data) {
            let genre;
            let collections = data.filter(item => item.data.classifications);
            collections = groupBy(collections, collection => {
                genre = collection.data.classifications.filter(c => c.genre)[0]
                    .genre;
                return genre;
            });
            var ordered = {};
            lodash(collections)
                .keys()
                .sort()
                .each(function(key) {
                    ordered[key] = collections[key];
                });

            return ordered;
        }

        function groupBySpeaker(data) {
            let collectionsBySpeaker = {};
            let speakers, roles, speakerRole;
            let collections = data.filter(item => item.data.classifications);
            collections.forEach(collection => {
                roles = collection.index.speakerRoles;
                speakers = collection.data.speakers.filter(speaker =>
                    includes(roles, speaker.role)
                );
                speakers.forEach(speaker => {
                    speakerRole = `${speaker.name} (${speaker.role})`;
                    if (!collectionsBySpeaker[speakerRole])
                        collectionsBySpeaker[speakerRole] = [];
                    collectionsBySpeaker[speakerRole].push(collection);
                });
            });
            var ordered = {};
            lodash(collectionsBySpeaker)
                .keys()
                .sort()
                .each(function(key) {
                    ordered[key] = collectionsBySpeaker[key];
                });

            return ordered;
        }
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
            if (shelljs.test("-e", image)) {
                shelljs.cp(image, `${item.path}/images/content`);

                const file = `${item.path}/images/${image
                    .split("/")
                    .pop()}.html`;
                const template = `${__dirname}/templates/image-browser.njk`;
                const html = nunjucks.render(template, item);
                fs.writeFileSync(file, html);
            }
        }
        item.data.thumbnails.forEach(image => {
            shelljs.cp(image, `${item.path}/images/content`);
        });
        return item;
    }

    createMediaBrowserPage({ item }) {
        shelljs.mkdir("-p", `${item.path}/media/content`);
        for (let i = 0; i < item.data.media.length; i++) {
            const medium = item.data.media[i];
            item.currentContext = {
                item: medium
            };
            medium.files.forEach(file => {
                if (shelljs.test("-e", file)) {
                    shelljs.cp(file, `${item.path}/media/content`);
                }
            });
            const file = `${item.path}/media/${medium.name}.html`;
            const template = `${__dirname}/templates/media-browser.njk`;
            const html = nunjucks.render(template, item);
            fs.writeFileSync(file, html);
        }
    }

    createDocumentsBrowserPage({ item }) {
        shelljs.mkdir("-p", `${item.path}/documents/content`);
        item.data.documents.forEach(document => {
            if (shelljs.test("-e", document.path)) {
                shelljs.cp(document.path, `${item.path}/documents/content`);
            }
        });
    }
}

module.exports = SiteGenerator;
