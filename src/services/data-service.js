"use strict";

const fs = require("fs-extra");
const util = require("util");
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const copy = util.promisify(fs.copyFile);
const shell = require("shelljs");
const { basename: pathBasename, dirname: pathDirname } = require("path");
const { findIndex } = require("lodash");
const { SiteGenerator } = require("./site-generator");
const rootPath = require("electron-root-path").rootPath;

const {
    isEmpty,
    isUndefined,
    compact,
    flattenDeep,
    includes,
    groupBy,
    orderBy,
    map,
    each,
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
        this.params = params;
        this.store = store;
        this.contentBase =
            process.env.NODE_ENV === "development"
                ? `${rootPath}/src`
                : `${rootPath}/Contents/Resources`;
    }

    log({ msg, level }) {
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
    }

    async load() {
        const {
            usbMountPoint,
            targetDevice,
            hostname,
            ssid,
            localDataPath
        } = this.params;
        let index;
        try {
            this.log({
                msg: "Preparing the target disk.",
                level: "info"
            });
            if (!(await this.prepareTarget({ targetDevice, usbMountPoint }))) {
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
            let { items, errors } = await this.buildDataTree(localDataPath);
            this.log({ msg: errors, level: "error" });
            this.log({ msg: "Data processed", level: "complete" });

            this.log({ msg: "Building the index.", level: "info" });
            index = this.buildIndex({
                items: items
            });
            this.log({ msg: "Index built", level: "complete" });

            let target;
            switch (targetDevice) {
                case "Raspberry Pi":
                    target = `${usbMountPoint}/html`;
                    this.log({
                        msg: "Installing the viewer.",
                        level: "info"
                    });
                    this.installCollectionViewer({ target });
                    this.log({
                        msg: "Viewer installed",
                        level: "complete"
                    });
                    await this.installTheData({
                        target,
                        localDataPath,
                        usbMountPoint,
                        index
                    });
                    break;

                case "LibraryBox":
                    target = `${usbMountPoint}/LibraryBox/www`;
                    this.log({
                        msg: "Configuring the system.",
                        level: "info"
                    });
                    this.updateLibraryBoxConfigurationFiles({
                        usbMountPoint,
                        hostname,
                        ssid
                    });
                    this.log({ msg: "System configured", level: "complete" });
                    this.log({
                        msg: "Installing the viewer.",
                        level: "info"
                    });
                    this.installCollectionViewer({ target });
                    this.log({
                        msg: "Viewer installed",
                        level: "complete"
                    });
                    await this.installTheData({
                        target,
                        localDataPath,
                        usbMountPoint,
                        index
                    });
                    break;

                case "USB Disk":
                    target = `${usbMountPoint}`;
                    this.log({ msg: "Generating the site.", level: "info" });
                    const siteGenerator = new SiteGenerator({
                        store: this.store,
                        index,
                        target
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

    async prepareTarget({ targetDevice, usbMountPoint }) {
        switch (targetDevice) {
            case "Raspberry Pi":
                fs.removeSync(`${usbMountPoint}/html`);
                fs.ensureDirSync(`${usbMountPoint}/html`);
                fs.ensureDirSync(`${usbMountPoint}/html/repository`);
                break;

            case "LibraryBox":
                s = await stat(`${usbMountPoint}/LibraryBox`);
                if (!s.isDirectory()) return false;
                fs.removeSync(`${usbMountPoint}/LibraryBox/www`);
                fs.ensureDirSync(`${usbMountPoint}/LibraryBox/www`);
                fs.ensureDirSync(`${usbMountPoint}/LibraryBox/www/repository`);
                break;
        }
        return true;
    }

    installCollectionViewer({ target }) {
        fs.copySync(`${this.contentBase}/viewer`, target);
    }

    updateLibraryBoxConfigurationFiles({ usbMountPoint, hostname, ssid }) {
        const target = `${usbMountPoint}/LibraryBox/Config`;
        [
            "librarybox_ftp.txt",
            "librarybox_ftpadmin.txt",
            "librarybox_ftpanon.txt",
            "librarybox_ftpsync.txt",
            "librarybox_shoutbox.txt"
        ].forEach(file => {
            fs.writeFileSync(`${target}/${file}`, "no\n");
        });

        fs.writeFileSync(`${target}/hostname.txt`, `${hostname}\n`);
        fs.writeFileSync(`${target}/system_hostname.txt`, `${hostname}\n`);
        fs.writeFileSync(`${target}/ssid.txt`, `${ssid}\n`);
    }

    buildIndex({ store, items }) {
        let data = undefined;
        items = items.map(item => {
            this.log({
                msg: `Generating the index for: ${item.collectionId} - ${
                    item.itemId
                }`,
                level: "info"
            });
            try {
                data = readCatalogFile({ item });
            } catch (error) {
                this.log({
                    msg: `Error generating the index for: ${
                        item.collectionId
                    } - ${item.itemId}`,
                    level: "error"
                });
            }
            return data;
        });
        return compact(items);

        function readCatalogFile({ item }) {
            let { dataPath, dataFile } = item;
            const data = parseXML(
                fs.readFileSync(dataFile, { encoding: "utf8" })
            );
            return createItemDataStructure({ path: dataPath, data });

            function parseXML(doc) {
                var parser = new DOMParser();
                var xmldoc = parser.parseFromString(doc, "text/xml");
                return convert(xmldoc);
            }
        }

        function createItemDataStructure({ path, data }) {
            const files = getFiles(path, data);
            if (isEmpty(files)) {
                this.log({
                    msg: `No files found in CAT XML`,
                    level: "error"
                });
                return {};
            }
            const mediaFiles = compact(
                filterFiles([...types.videoTypes, ...types.audioTypes], files)
            );
            let imageFiles = compact(filterFiles(types.imageTypes, files));
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
                filterFiles(types.documentTypes, files)
            );
            const transcriptionFiles = compact(
                filterFiles(types.transcriptionTypes, files)
            );

            let classifications = get(data.item.adminInfo, "adminComment");
            if (classifications && classifications.match(/\[.*\]/)) {
                classifications = classifications
                    .replace("[", "")
                    .replace("]", "")
                    .split(":::");
                classifications = compact(
                    classifications.map(c => (c !== "" ? c.trim() : undefined))
                );
                classifications = classifications.map(c => {
                    return {
                        [c.split(":")[0]]: c.split(":")[1].trim()
                    };
                });
            } else {
                classifications = undefined;
            }
            data = {
                speakers: getSpeakers({ data }),
                classifications,
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
                media: getMediaData([...mediaFiles, ...transcriptionFiles]),
                openAccess: get(data.item, "private") === "false",
                rights: get(data.item.adminInfo, "dataAccessConditions"),
                title: get(data.item, "title"),
                transcriptions: transcriptionFiles.map(t => {
                    return { name: t.name, url: t.path };
                })
            };
            data.elements = sum(
                ["documents", "images", "media"].map(element => {
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

            function getSpeakers({ data }) {
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

            function filterFiles(types, files) {
                let extension;
                return files.filter(file => {
                    extension = file.name.split(".")[1];
                    return includes(types, extension.toLowerCase());
                });
            }

            function getMediaData(files) {
                files = groupBy(files, file => {
                    return file.name.split(".")[0];
                });
                return map(files, (v, k) => {
                    return {
                        name: k,
                        files: filter([...v], "media"),
                        eaf: filter([...v], "eaf"),
                        flextext: filter([...v], "flextext"),
                        ixt: filter([...v], "ixt"),
                        trs: filter([...v], "trs"),
                        type: v[0].type.split("/")[0]
                    };
                });

                function filter(files, what) {
                    if (what === "media") {
                        const set = [...types.videoTypes, ...types.audioTypes];
                        files = files.filter(file => {
                            return includes(set, file.name.split(".")[1]);
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
    }

    async installTheData({ target, index }) {
        this.log({
            msg: "Loading the data (this can take some time).",
            level: "info"
        });

        target = `${target}/repository`;

        const rootPath = target;

        let processedIndex = [];
        this.store.commit("updateDataLoadProgress", {
            total: index.length,
            n: 0
        });

        for (let item of index) {
            if (this.store.state.stopDataLoad) break;
            this.store.commit("updateDataLoadProgress", {
                total: index.length,
                n: findIndex(index, {
                    collectionId: item.collectionId,
                    itemId: item.itemId
                })
            });
            processedIndex.push(item);
            ({ target } = this.setup(rootPath, item));
            item = await this.processImages({ target, item });
            item = await this.processTranscriptions({
                target,
                item
            });
            item = await this.processMedia({ target, item: item });
            item = await this.processDocuments({ target, item: item });

            const transcriptions = groupBy(item.transcriptions, "name");
            item.media = item.media.map(media => {
                ["eaf", "trs", "ixt", "flextext"].forEach(t => {
                    media[t] = media[t].map(tw => transcriptions[tw.name][0]);
                });
                return media;
            });
        }
        this.log({ msg: "Data loaded", level: "complete" });
        this.writeIndexFile({ target: rootPath, index: processedIndex });
        this.store.commit("updateDataLoadProgress", {
            total: index.length,
            n: index.length
        });
        return { index };
    }

    async processImages({ target, item }) {
        for (let image of item.images) {
            image.path = await this.copyToTarget({ file: image.path, target });
            image.thumbnail = await this.copyToTarget({
                file: image.thumbnail,
                target
            });
        }
        return item;
    }

    async processTranscriptions({ target, item }) {
        for (let transcription of item.transcriptions) {
            transcription.url = await this.copyToTarget({
                file: transcription.url,
                target
            });
        }
        return item;
    }

    async processMedia({ target, item }) {
        for (let media of item.media) {
            let files = [];
            for (let file of media.files) {
                files.push(await this.copyToTarget({ target, file }));
            }
            media.files = compact(files);
        }
        return item;
    }

    async processDocuments({ target, item }) {
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

    writeIndexFile({ target, index }) {
        this.log({
            msg: "Writing the index file.",
            level: "info"
        });
        fs.writeFileSync(`${target}/index.json`, JSON.stringify(index), "utf8");
        this.log({
            msg: "Index file written.",
            level: "complete"
        });
    }

    async buildDataTree(path) {
        try {
            let dataFolders = await scandir(path);
            dataFolders = flattenDeep(dataFolders);
            dataFolders = compact(dataFolders);
            let errors = [];

            let items = [];
            for (let folder of dataFolders) {
                if (folder.dataFile.length > 1) {
                    errors.push(
                        `${
                            folder.dataPath
                        } has more than 1 Catalog file: "${folder.dataFile.join(
                            ", "
                        )}". Skipping this folder.`
                    );
                } else {
                    const cid = folder.dataFile[0].split("-")[0];
                    const iid = folder.dataFile[0].split("-")[1];
                    items.push({
                        dataPath: folder.dataPath,
                        dataFile: `${folder.dataPath}/${folder.dataFile[0]}`,
                        collectionId: cid,
                        itemId: iid
                    });
                }
            }
            return { items, errors };
        } catch (e) {
            console.log(e);
        }

        async function scandir(path) {
            let dataFolders = [];
            let errors = [];
            let subfolder, content, dataFile;
            if (await isDirectory(path)) {
                content = await readdir(path);
                dataFile = containsCatXMLFile(content);
                if (dataFile.length > 0) {
                    dataFolders.push({
                        dataPath: path,
                        dataFile: dataFile
                    });
                }
                for (let i of content) {
                    subfolder = `${path}/${i}`;
                    if (isDirectory(subfolder)) {
                        dataFolders.push(await scandir(subfolder));
                    }
                }
            }
            return dataFolders;
        }

        async function isDirectory(path) {
            const pathStat = await stat(path);
            return pathStat.isDirectory();
        }

        function containsCatXMLFile(content) {
            let files = content
                .filter(f => f.match(/CAT-PDSC_ADMIN\.xml/))
                .filter(f => !f.match(/^\..*/));
            return files;
        }
    }
}
