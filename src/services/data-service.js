"use strict";

const fs = require("fs-extra");
const path = require("path");
const util = require("util");
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const copy = util.promisify(fs.copyFile);
const shell = require("shelljs");
const { basename: pathBasename, dirname: pathDirname } = require("path");
const { findIndex } = require("lodash");
const { SiteGenerator } = require("./site-generator");
const walk = require("walk");
const app = require("electron").remote.app;
const rootPath = app.getAppPath();

const ocflObjectFile = "0=ocfl_object_1.0";

const {
    isEmpty,
    isUndefined,
    compact,
    flattenDeep,
    uniq,
    uniqBy,
    groupBy,
    orderBy,
    isArray,
    sum
} = require("lodash");
const { convert } = require("./xml-to-json-service");
const DOMParser = require("xmldom").DOMParser;

const types = {
    imageTypes: ["jpg", "jpeg", "png"],
    videoTypes: ["mp4", "ogg", "ogv", "mov", "webm"],
    audioTypes: ["mp3", "ogg", "oga"],
    documentTypes: ["pdf"],
    transcriptionTypes: ["eaf", "trs", "ixt", "flextext"]
};

export class DataLoader {
    constructor({ store, params }) {
        this.usbMountPoint = params.usbMountPoint;
        this.targetDevice = params.targetDevice;
        this.localDataPath = params.localDataPath;
        this.store = store;
        switch (process.env.NODE_ENV) {
            case "development":
                this.contentBase = `${rootPath}/../../src`;
                break;
            case "testing":
                this.contentBase = `${rootPath}/../../../src`;
                break;
            case "production":
                this.contentBase = rootPath.replace("/app.asar", "");
                break;
        }
    }

    log({ msg, level }) {
        if (this.store) {
            switch (level) {
                case "info":
                    this.store.commit("setInfoMessage", msg);
                    break;
                case "error":
                    this.store.commit("setErrorMessage", msg);
                    break;
                case "complete":
                    this.store.commit("setCompleteMessage", msg);
                    break;
            }
        } else {
            console.log(level, msg);
        }
    }

    updateLoadingStatus(payload) {
        if (this.store) {
            this.store.commit("updateDataLoadProgress", payload);
        }
    }

    async load() {
        let index;
        try {
            this.log({
                msg: "Preparing the target disk.",
                level: "info"
            });
            if (!(await this.prepareTarget())) {
                this.log({
                    msg: "There was an error preparing the target disk.",
                    level: "error"
                });
            }
            this.log({
                msg: "Disk prepared",
                level: "complete"
            });

            this.log({
                msg: "Processing the data to be loaded.",
                level: "info"
            });

            let { folders, errors } = await this.walk();
            this.log({ msg: "Data processed", level: "complete" });
            errors.forEach(error => this.log(error));

            this.log({ msg: "Building the index.", level: "info" });
            const { collections, items } = this.buildIndex({ folders });
            this.log({ msg: "Index built", level: "complete" });

            let target;
            switch (this.targetDevice) {
                case "Raspberry Pi":
                    this.log({
                        msg: "Installing the viewer.",
                        level: "info"
                    });
                    this.installCollectionViewer();
                    this.log({
                        msg: "Viewer installed",
                        level: "complete"
                    });
                    await this.installTheData({ collections, items });
                    break;

                case "USB Disk":
                    this.log({ msg: "Generating the site.", level: "info" });
                    const siteGenerator = new SiteGenerator({
                        store: this.store,
                        index: items,
                        target: this.usbMountPoint
                    });
                    siteGenerator.generate();
                    this.log({
                        msg: "Site generation complete",
                        level: "complete"
                    });
                    break;
            }

            this.log({
                msg: "Done.",
                level: "complete"
            });
        } catch (error) {
            console.log(error);
            this.log({ msg: error.message, level: "error" });
        }
    }

    async prepareTarget() {
        try {
            await fs.remove(`${this.usbMountPoint}/html`);
            await fs.ensureDir(`${this.usbMountPoint}/html`);
            await fs.ensureDir(`${this.usbMountPoint}/html/repository`);
            return true;
        } catch (error) {
            return false;
        }
    }

    installCollectionViewer() {
        const target = `${this.usbMountPoint}/html`;
        fs.copySync(`${this.contentBase}/viewer`, target);
    }

    buildIndex({ folders }) {
        var self = this;
        let items = [];
        let collections = [];
        for (let folder of folders) {
            if (folder.type === "CAT-XML") {
                let { item, collection } = readCatalogFile({ folder });
                // console.log(JSON.stringify(item, null, 2));
                // console.log(JSON.stringify(collection, null, 2));
                if (!item) {
                    this.log({
                        msg: `Skipping: ${folder.folder}`,
                        level: "error"
                    });
                    continue;
                }

                this.log({
                    msg: `Generated the index for item: ${item.collectionId}/${item.itemId}`,
                    level: "info"
                });
                items.push(item);
                this.log({
                    msg: `Generated the index for collection: ${collection.collectionId}`,
                    level: "info"
                });
                collections.push(collection);
            } else if (folder.type === "OCFL") {
                // TODO: not yet implemented
            }
        }
        collections = groupBy(collections, "collectionId");
        const collectionIds = Object.keys(collections);
        for (let collectionId of collectionIds) {
            let collection = collections[collectionId];
            const items = flattenDeep(collection.map(c => c.items));
            const classifications = uniqBy(
                flattenDeep(collection.map(c => c.classifications)),
                "value"
            );
            const people = uniqBy(
                flattenDeep(collection.map(c => c.people)),
                "name"
            );
            collections[collectionId] = {
                ...collection[0],
                people,
                classifications,
                items
            };
        }
        collections = collectionIds.map(
            collectionId => collections[collectionId]
        );

        return { items, collections };

        function readCatalogFile({ folder }) {
            let dataFile = path.join(folder.folder, folder.file);
            const data = parseXML(
                fs.readFileSync(dataFile, { encoding: "utf8" })
            );
            let { people, classifications, languages, categories } = getFilters(
                {
                    data
                }
            );
            let item = createItemDataStructure({ folder, data });
            if (!item) {
                self.log({
                    msg: `No files listed in ${dataFile}`,
                    level: "error"
                });
                return { item: null, collection: null };
            }
            item = { ...item, people, classifications, languages, categories };

            let collection = createCollectionDataStructure({ folder, data });
            collection.people = uniqBy(
                [...getCollectionPeople({ data }), ...people],
                "name"
            );
            collection.classifications = classifications;
            collection.languages = languages;
            collection.categories = categories;
            collection.items = [item.itemId];

            return { item, collection };

            function parseXML(doc) {
                var parser = new DOMParser();
                var xmldoc = parser.parseFromString(doc, "text/xml");
                return convert(xmldoc);
            }
        }

        function createCollectionDataStructure({ folder, data }) {
            let collectionData = {
                title: get(data.item.collection, "title"),
                description: get(data.item.collection, "description"),
                collectionId: get(data.item.collection, "identifier")
            };
            function get(leaf, thing) {
                try {
                    return leaf[thing]["#text"] || "";
                } catch (e) {
                    return "";
                }
            }
            return collectionData;
        }

        function createItemDataStructure({ folder, data }) {
            const files = getFiles(folder.folder, data);
            if (isEmpty(files)) {
                return null;
            }
            const audioFiles = compact(
                filterFiles({ types: types.audioTypes, files })
            );
            const videoFiles = compact(
                filterFiles({ types: types.videoTypes, files })
            );
            let imageFiles = compact(
                filterFiles({ types: types.imageTypes, files })
            );
            imageFiles = compact(
                imageFiles.filter(image => !image.name.match("thumb"))
            );
            imageFiles = imageFiles.map(image => {
                let thumbnail = pathBasename(image.path);
                thumbnail = `${thumbnail.split(".")[0]}-thumb-PDSC_ADMIN.${
                    thumbnail.split(".")[1]
                }`;
                image.thumbnail = `${pathDirname(image.path)}/${thumbnail}`;
                return image;
            });
            const documentFiles = compact(
                filterFiles({ types: types.documentTypes, files })
            );
            const transcriptionFiles = compact(
                filterFiles({ types: types.transcriptionTypes, files })
            );

            data = {
                citation: get(data.item, "citation"),
                collectionId: get(data.item, "identifier").split("-")[0],
                collectionLink: `http://catalog.paradisec.org.au/collections/${get(
                    data,
                    "collectionId"
                )}`,
                date: get(data.item, "originationDate"),
                description: get(data.item, "description"),
                documents: documentFiles,
                identifier: [
                    get(data.item, "identifier"),
                    get(data.item, "archiveLink")
                ],
                images: imageFiles,
                itemId: get(data.item, "identifier").split("-")[1],
                audio: getMediaData({
                    files: [...audioFiles, ...transcriptionFiles],
                    type: "audio"
                }),
                video: getMediaData({
                    files: [...videoFiles, ...transcriptionFiles],
                    type: "video"
                }),
                openAccess: get(data.item, "private") === "false",
                rights: get(data.item.adminInfo, "dataAccessConditions"),
                title: get(data.item, "title"),
                transcriptions: transcriptionFiles.map(t => {
                    return { name: t.name, path: t.path };
                })
            };
            data.elements = sum(
                ["documents", "images", "audio", "video"].map(element => {
                    return data[element].length;
                })
            );
            return data;

            function get(leaf, thing) {
                try {
                    return leaf[thing]["#text"];
                } catch (e) {
                    return "";
                }
            }

            function getFiles(path, data) {
                const collectionId = get(data.item, "identifier").split("-")[0];
                const itemId = get(data.item, "identifier").split("-")[1];
                if (isUndefined(data.item.files.file)) return [];
                if (!isArray(data.item.files.file)) {
                    data.item.files.file = [data.item.files.file];
                }
                if (isEmpty(data.item.files.file)) return [];
                return data.item.files.file.map(file => {
                    return {
                        name: `${get(file, "name")}`,
                        path: `${path}/${get(file, "name")}`,
                        type: get(file, "mimeType")
                    };
                });
            }

            function filterFiles({ files, types }) {
                let extension;
                return files.filter(file => {
                    extension = file.name.split(".")[1];
                    return types.includes(extension.toLowerCase());
                });
            }

            function getMediaData({ files, type }) {
                files = filter(files, type);
                return files.map(file => {
                    return {
                        name: file.split("/").pop(),
                        path: file
                    };
                });
                return files;

                function filter(files, what) {
                    if (what === "audio") {
                        const set = types.audioTypes;
                        files = files.filter(file => {
                            return set.includes(file.name.split(".")[1]);
                        });
                        return files.map(file => file.path);
                    } else if (what === "video") {
                        const set = types.videoTypes;
                        files = files.filter(file => {
                            return set.includes(file.name.split(".")[1]);
                        });
                        return files.map(file => file.path);
                    } else {
                        files = files.filter(file => {
                            return file.name.split(".")[1] === what;
                        });
                        return files.map(file => {
                            return {
                                name: file.name,
                                url: file.path
                            };
                        });
                    }
                }
            }
        }

        function getCollectionPeople({ data }) {
            if (!data.item.collection.collector) {
                return {};
            }
            return [
                {
                    role: "collector",
                    name: data.item.collection.collector["#text"]
                }
            ];
        }

        function getFilters({ data }) {
            const classifications = getClassifications({ data });
            const people = getPeople({ data });
            const languages = getLanguages({ data });
            const categories = getDataCategories({ data });
            return { people, classifications, languages, categories };

            function get(leaf, thing) {
                try {
                    return leaf[thing]["#text"];
                } catch (e) {
                    return "";
                }
            }

            function getClassifications({ data }) {
                let classifications = get(data.item.adminInfo, "adminComment");
                if (classifications && classifications.match(/\[.*\]/)) {
                    classifications = classifications
                        .replace("[", "")
                        .replace("]", "")
                        .split(":::");
                    classifications = compact(
                        classifications.map(c =>
                            c !== "" ? c.trim() : undefined
                        )
                    );
                    classifications = classifications.map(c => {
                        return {
                            name: c.split(":")[0],
                            value: c.split(":")[1].trim()
                        };
                    });
                } else {
                    classifications = [];
                }
                return classifications;
            }

            function getPeople({ data }) {
                if (!data.item.agents.agent) {
                    return [];
                }
                if (!isArray(data.item.agents.agent)) {
                    data.item.agents.agent = [data.item.agents.agent];
                }
                let agents = data.item.agents.agent.map(agent => {
                    return {
                        role: agent["@attributes"].role,
                        name: agent["#text"].trim()
                    };
                });
                return orderBy(agents, ["name"]);
            }

            function getLanguages({ data }) {
                let languages = [];
                languages.push(data.item.language["#text"]);

                ["subjectLanguages", "contentLanguages"].forEach(
                    languageType => {
                        if (isArray(data.item[languageType].language)) {
                            languages.push(
                                data.item[languageType].language.map(
                                    language => language["#text"]
                                )
                            );
                        } else {
                            if (data.item[languageType.language])
                                languages.push(
                                    data.item[languageType].language["#text"]
                                );
                        }
                    }
                );

                languages = flattenDeep(languages);
                languages = compact(languages);
                languages = uniq(languages);
                return languages.sort();
            }

            function getDataCategories({ data }) {
                let categories = [];
                if (isArray(data.item.dataCategories.category)) {
                    categories.push(
                        data.item.dataCategories.category.map(c => c["#text"])
                    );
                } else {
                    if (data.item.dataCategories.category)
                        categories.push(
                            data.item.dataCategories.category["#text"]
                        );
                }
                categories = flattenDeep(categories);
                categories = compact(categories);
                if (
                    categories.includes("instrumental music") ||
                    categories.includes("song")
                ) {
                    categories = ["music"];
                } else {
                    categories = [];
                }
                return categories;
            }
        }
    }

    async installTheData({ collections, items }) {
        let target = `${this.usbMountPoint}/html/repository`;
        this.log({
            msg: "Loading the data (this can take some time).",
            level: "info"
        });

        const rootPath = target;

        let processedItems = [];
        this.updateLoadingStatus({
            total: items.length,
            n: 0
        });

        for (let [idx, item] of items.entries()) {
            if (this.store && this.store.state.stopDataLoad) break;
            this.updateLoadingStatus({
                total: items.length,
                n: idx
            });
            ({ target } = this.setup(rootPath, item));
            item = await this.copyImages({ target, item });
            item = await this.copyTranscriptions({
                target,
                item
            });
            item = await this.copyMedia({ target, item: item });
            item = await this.copyDocuments({ target, item: item });
            processedItems.push(item);
        }
        this.log({ msg: "Data loaded", level: "complete" });
        this.writeIndexFile({
            target: rootPath,
            items: processedItems,
            collections
        });
        this.updateLoadingStatus({
            total: items.length,
            n: items.length
        });
        return { items, collections };
    }

    async copyImages({ target, item }) {
        for (let image of item.images) {
            image.path = await this.copyToTarget({ file: image.path, target });
            image.thumbnail = await this.copyToTarget({
                file: image.thumbnail,
                target
            });
        }
        return item;
    }

    async copyTranscriptions({ target, item }) {
        for (let transcription of item.transcriptions) {
            transcription.path = await this.copyToTarget({
                file: transcription.path,
                target
            });
        }
        return item;
    }

    async copyMedia({ target, item }) {
        for (let type of ["audio", "video"]) {
            for (let file of item[type]) {
                file.path = await this.copyToTarget({
                    target,
                    file: file.path
                });
            }
        }
        return item;
    }

    async copyDocuments({ target, item }) {
        for (let document of item.documents) {
            document.path = await this.copyToTarget({
                file: document.path,
                target
            });
        }
        return item;
    }

    setup(target, item) {
        const cid = item.collectionId;
        const iid = item.itemId;
        target = `${target}/${cid}/${iid}`;
        shell.mkdir("-p", target);
        return { cid, iid, target };
    }

    async copyToTarget({ target, file }) {
        try {
            const name = file.split("/").pop();
            target = `${target}/${name}`;
            if (shell.test("-f", `${file}`)) {
                // shell.cp(`${file}`, `${target}`);
                this.log({ msg: `Loading: ${file}`, level: "info" });
                await copy(file, target);

                // this.log({ msg: `Loaded: ${file}`, level: "info" });
                return `/repository/${target.split("repository/")[1]}`;
            } else {
                this.log({
                    msg: `Missing source file: ${file}`,
                    level: "error"
                });
                return null;
            }
        } catch (error) {
            this.log({
                msg: `Missing source file: ${file}`,
                level: "error"
            });
            return null;
        }
    }

    writeIndexFile({ target, collections, items }) {
        this.log({
            msg: "Writing the index file.",
            level: "info"
        });
        fs.writeFileSync(
            `${target}/index.json`,
            JSON.stringify({ collections, items }),
            "utf8"
        );
        this.log({
            msg: "Index file written.",
            level: "complete"
        });
    }

    walk() {
        let errors = [];
        return new Promise((resolve, reject) => {
            let walker = walk.walk(this.localDataPath, {});
            let dataFolders = [];

            walker.on("directories", async (root, subfolders, next) => {
                for (let folder of subfolders) {
                    dataFolders.push(
                        await scandir({ folder: path.join(root, folder.name) })
                    );
                }
                next();
            });
            walker.on("errors", (root, nodeStatsArray, next) => {
                next();
            });

            walker.on("end", () => {
                resolve({ folders: compact(dataFolders), errors });
            });
        });

        async function scandir({ folder }) {
            let content = await readdir(folder);
            let files = containsOCFLObject({ content });
            if (files.length) {
                return { folder, type: "OCFL" };
            } else {
                files = containsCatXMLFile({ content });
                if (!files.length) return null;
                if (files.length !== 1) {
                    errors.push({
                        msg: `${folder} has more than one CAT XMl file.`,
                        level: "error"
                    });
                    return null;
                }
                return { folder, type: "CAT-XML", file: files[0] };
            }
            return null;
        }

        function containsCatXMLFile({ content }) {
            let files = content
                .filter(f => f.match(/CAT-PDSC_ADMIN\.xml/))
                .filter(f => !f.match(/^\..*/));
            return files;
        }

        function containsOCFLObject({ content }) {
            const re = new RegExp(ocflObjectFile);
            let files = content.filter(f => f.match(re));
            return files;
        }
    }
}
