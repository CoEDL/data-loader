'use strict';

const util = require('util');
const fs = require('fs-extra');
const {basename} = require('path');
const copy = util.promisify(fs.copyFile);
const shelljs = require('shelljs');
const nunjucks = require('nunjucks');
const {
    uniqBy,
    isEmpty,
    compact,
    groupBy,
    includes,
    findIndex,
} = require('lodash');
const lodash = require('lodash');
const app = require('electron').remote.app;
const rootPath = app.getAppPath();

const speakerRolesToDisplay = [
    'participant',
    'performer',
    'signer',
    'singer',
    'speaker',
];

export class SiteGenerator {
    constructor({store, index, target}) {
        this.index = index;
        this.target = `${target}/catalog`;
        this.store = store;
        this.contentBase =
            process.env.NODE_ENV === 'development'
                ? `${rootPath}/../../src`
                : `${rootPath.replace('/app.asar', '')}`;
    }

    log({msg, level}) {
        if (this.store) {
            switch (level) {
                case 'info':
                    this.store.commit('setInfoMessage', msg);
                    break;
                case 'error':
                    this.store.commit('setErrorMessage', msg);
                    break;
                case 'complete':
                    this.store.commit('setCompleteMessage', msg);
                    break;
            }
        } else {
            console.log(msg);
        }
    }

    updateLoadingStatus(payload) {
        if (this.store) {
            this.store.commit('updateDataLoadProgress', payload);
        }
    }

    async generate() {
        this.log({msg: 'Removing existing data', level: 'info'});
        fs.removeSync(`${this.target}`);
        this.log({msg: 'Creating index page', level: 'info'});
        this.updateLoadingStatus({
            total: this.index.length,
            n: 0,
        });
        for (let item of this.index) {
            if (this.store && this.store.state.stopDataLoad) break;
            this.updateLoadingStatus({
                total: this.index.length,
                n: findIndex(this.index, {
                    collectionId: item.collectionId,
                    itemId: item.itemId,
                }),
            });
            item = this.stripMissingFiles({item});
            item.people = compact(
                item.people.map(person => {
                    if (includes(speakerRolesToDisplay, person.role))
                        return person;
                })
            );
            item.path = `${this.target}/${item.collectionId}/${item.itemId}`;
            this.log({
                msg: `Setting up data path for ${item.collectionId}/${item.itemId}`,
                level: 'info',
            });
            this.setupSite({item});
            this.log({
                msg: `Creating file browser for ${item.collectionId}/${item.itemId}`,
                level: 'info',
            });
            this.createFileBrowserPage({item});

            this.log({
                msg: `Creating image browser for ${item.collectionId}/${item.itemId}`,
                level: 'info',
            });
            this.createImageBrowserPage({item});

            this.log({
                msg: `Creating media browser ${item.collectionId}/${item.itemId}`,
                level: 'info',
            });
            this.createMediaBrowserPage({item});

            this.log({
                msg: `Creating documents browser ${item.collectionId}/${item.itemId}`,
                level: 'info',
            });
            this.createDocumentsBrowserPage({item});

            this.log({
                msg: `Done generating ${item.collectionId}/${item.itemId}`,
                level: 'complete',
            });
        }
        this.updateLoadingStatus({
            total: this.index.length,
            n: this.index.length,
        });
        this.createIndexPage();
    }

    stripMissingFiles({item}) {
        item.images = compact(
            item.images.map(image => {
                if (shelljs.test('-e', image.path)) return image;
                this.log({
                    msg: `${item.collectionId} / ${item.itemId} missing file: ${image.path}`,
                    level: 'error',
                });
            })
        );
        item.media = [...item.audio, ...item.video];
        item.media = compact(
            item.media.map(m => {
                if (shelljs.test('-e', m.path)) return m.path;
                this.log({
                    msg: `${item.collectionId} / ${item.itemId} missing file: ${m.file}`,
                    level: 'error',
                });
                // m.files = compact(
                //     m.files.map(file => {
                //         if (shelljs.test('-e', file)) return file;
                //         this.log({
                //             msg: `${item.collectionId} / ${item.itemId} missing file: ${file}`,
                //             level: 'error',
                //         });
                //     })
                // );
                if (!isEmpty(m.files)) return m;
            })
        );
        item.documents = compact(
            item.documents.map(document => {
                if (shelljs.test('-e', document.path)) return document;
                this.log({
                    msg: `${item.collectionId} / ${item.itemId} missing file: ${document.path}`,
                    level: 'error',
                });
            })
        );
        return item;
    }

    setupSite({item}) {
        shelljs.mkdir('-p', item.path);
        [
            'assets',
            'files',
            'information',
            'images',
            'media',
            'documents',
        ].forEach(component => {
            shelljs.mkdir('-p', `${item.path}/${component}`);
        });
        if (process.env.NODE_ENV === 'development') {
            shelljs.cp(
                `${rootPath}/src/services/templates/styles.css`,
                `${item.path}/assets/`
            );
            shelljs.cp(
                `${rootPath}/node_modules/bootstrap/dist/css/bootstrap.min.css`,
                `${item.path}/assets/`
            );
            shelljs.cp(
                `${rootPath}/node_modules/@fortawesome/fontawesome-free/js/all.js`,
                `${item.path}/assets/fontawesome.js`
            );
        } else {
            shelljs.cp(
                `${rootPath}/Contents/Resources/templates/styles.css`,
                `${item.path}/assets/`
            );
            shelljs.cp(
                `${rootPath}/Contents/Resources/templates/bootstrap.min.css`,
                `${item.path}/assets/`
            );
            shelljs.cp(
                `${rootPath}/Contents/Resources/templates/fontawesome.js`,
                `${item.path}/assets/`
            );
        }
    }

    createIndexPage() {
        shelljs.mkdir('-p', `${this.target}/assets`);
        if (process.env.NODE_ENV === 'development') {
            shelljs.cp(
                `${rootPath}/src/services/templates/styles.css`,
                `${this.target}/assets/`
            );
            shelljs.cp(
                `${rootPath}/node_modules/bootstrap/dist/css/bootstrap.min.css`,
                `${this.target}/assets/`
            );
            shelljs.cp(
                `${rootPath}/node_modules/@fortawesome/fontawesome-free/js/all.js`,
                `${this.target}/assets/fontawesome.js`
            );
        } else {
            shelljs.cp(
                `${rootPath}/Contents/Resources/templates/styles.css`,
                `${this.target}/assets/`
            );
            shelljs.cp(
                `${rootPath}/Contents/Resources/templates/bootstrap.min.css`,
                `${this.target}/assets/`
            );
            shelljs.cp(
                `${rootPath}/Contents/Resources/templates/fontawesome.js`,
                `${this.target}/assets/`
            );
        }
        const file = `${this.target}/index.html`;
        const template = `${this.contentBase}/index.njk`;
        let data = {
            byIdentifier: groupByIdentifier(this.index),
            byGenre: isEmpty(groupByGenre(this.index))
                ? undefined
                : groupByGenre(this.index),
            bySpeaker: isEmpty(groupBySpeaker(this.index))
                ? undefined
                : groupBySpeaker(this.index),
        };
        const html = nunjucks.render(template, {data});
        fs.writeFileSync(file, html);

        function groupByIdentifier(index) {
            let collections = groupBy(index, 'collectionId');
            var ordered = {};
            lodash(collections)
                .keys()
                .sort()
                .each(function(key) {
                    ordered[key] = uniqBy(collections[key], 'itemId');
                });

            return ordered;
        }

        function groupByGenre(data) {
            let genre;
            let collections = data.filter(item => item.classifications);
            // collections = groupBy(collections, collection => {
            //     genre = collection.classifications.filter(c => c.genre)[0]
            //         .genre;
            //     return genre;
            // });
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
            let collections = data.filter(item => item.speakers);
            collections.forEach(collection => {
                speakers = collection.speakers.filter(speaker =>
                    includes(speakerRolesToDisplay, speaker.role)
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
                    ordered[key] = uniqBy(collectionsBySpeaker[key], [
                        'collectionId',
                        'itemId',
                    ]);
                });

            return ordered;
        }
    }

    // createInformationPage({ item }) {
    //     const file = `${item.path}/information/index.html`;
    //     const template = `${__dirname}/templates/information.njk`;
    //     const html = nunjucks.render(template, item);
    //     fs.writeFileSync(file, html);
    // }

    createFileBrowserPage({item}) {
        const file = `${item.path}/files/index.html`;
        const template = `${this.contentBase}/file-browser.njk`;
        const html = nunjucks.render(template, item);
        fs.writeFileSync(file, html);
    }

    createImageBrowserPage({item}) {
        shelljs.mkdir('-p', `${item.path}/images/content`);
        for (let i = 0; i < item.images.length; i++) {
            const first = `${item.images[0].path.split('/').pop()}.html`;
            const last = `${item.images[item.images.length - 1].path
                .split('/')
                .pop()}.html`;
            let image = item.images[i];
            item.currentContext = {
                first: i === 0 ? null : first,
                previous:
                    i === 0
                        ? null
                        : `${item.images[i - 1].path.split('/').pop()}.html`,
                name: `./content/${image.path.split('/').pop()}`,
                meta: `Image ${i + 1} of ${item.images.length}`,
                next:
                    i === item.images.length - 1
                        ? null
                        : `${item.images[i + 1].path.split('/').pop()}.html`,
                last: i === item.images.length - 1 ? null : last,
            };
            if (shelljs.test('-e', image.path)) {
                this.copyFile(image.path, `${item.path}/images/content`);
                this.copyFile(image.thumbnail, `${item.path}/images/content`);

                const file = `${item.path}/images/${image.path
                    .split('/')
                    .pop()}.html`;
                const template = `${this.contentBase}/image-browser.njk`;
                const html = nunjucks.render(template, item);
                fs.writeFileSync(file, html);
            }
        }
    }

    createMediaBrowserPage({item}) {
        shelljs.mkdir('-p', `${item.path}/media/content`);
        // console.log(item);
        for (let file of item.audio) {
            if (shelljs.test('-e', file.path)) {
                this.copyFile(file.path, `${item.path}/media/content`);
            }
            file = `${item.path}/media/${file.name}.html`;
            const template = `${this.contentBase}/media-browser.njk`;
            const html = nunjucks.render(template, item);
            fs.writeFileSync(file, html);
        }
        // for (let i = 0; i < item.media.length; i++) {
        //     const medium = item.media[i];
        //     item.currentContext = {
        //         item: medium,
        //     };
        //     medium.files.forEach(file => {
        //         if (shelljs.test('-e', file)) {
        //             this.copyFile(file, `${item.path}/media/content`);
        //         }
        //     });
        //     const file = `${item.path}/media/${medium.name}.html`;
        //     const template = `${this.contentBase}/media-browser.njk`;
        //     const html = nunjucks.render(template, item);
        //     fs.writeFileSync(file, html);
        // }
    }

    createDocumentsBrowserPage({item}) {
        shelljs.mkdir('-p', `${item.path}/documents/content`);
        item.documents.forEach(document => {
            if (shelljs.test('-e', document.path)) {
                this.copyFile(document.path, `${item.path}/documents/content`);
            }
        });
    }

    async copyFile(source, target) {
        let filename = basename(source);
        try {
            await copy(source, `${target}/${filename}`);
        } catch (error) {
            // do nothing
        }
    }
}
