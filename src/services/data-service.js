'use strict';

const fs = require('fs');
const util = require('util');
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const shell = require('shelljs');

const {compact, flattenDeep, includes, groupBy, map, each} = require('lodash');
const {convert} = require('./xml-to-json-service');
const DOMParser = require('xmldom').DOMParser;

module.exports = {
    buildDataTree,
    readCatalogFile,
    buildIndex,
    prepareTarget,
    installTheData,
    writeIndexFile
};

const types = {
    imageTypes: ['jpg', 'jpeg', 'png'],
    videoTypes: ['mp4', 'ogg', 'ogv', 'mov', 'webm'],
    audioTypes: ['mp3', 'ogg', 'oga'],
    documentTypes: ['pdf'],
    transcriptionTypes: ['eaf', 'trs', 'ixt', 'flextext']
};

function writeIndexFile(target, index) {
    fs.writeFileSync(
        `${target}/www/repository/index.json`,
        JSON.stringify(index),
        'utf8'
    );
}

function installTheData(dataPath, target, index) {
    let errors = [];
    each(index, (item, collectionId) => {
        each(item, (item, itemId) => {
            item = processImages(dataPath, target, item);
            item = processTranscriptions(dataPath, target, item);
            item = processMedia(dataPath, target, item);
            item = processDocuments(dataPath, target, item);
        });
    });
    return {index, errors};

    function processImages(source, targetPath, item) {
        let name;
        const {cid, iid, target} = setup(targetPath, item);
        item.images = item.images.map(file => {
            try {
                return copyToTarget({cid, iid, source, target, file});
            } catch (e) {}
        });

        item.thumbnails = item.thumbnails.map(file => {
            try {
                return copyToTarget({cid, iid, source, target, file});
            } catch (e) {}
        });
        item.images = compact(item.images);
        item.thumbnails = compact(item.thumbnails);
        return item;
    }

    function processTranscriptions(source, targetPath, item) {
        let name;
        const {cid, iid, target} = setup(targetPath, item);
        item.transcriptions = item.transcriptions.map(file => {
            try {
                const url = copyToTarget({
                    cid,
                    iid,
                    source,
                    target,
                    file: file.url
                });
                return {
                    name: file.name,
                    url
                };
            } catch (e) {}
        });
        item.transcriptions = compact(item.transcriptions);
        return item;
    }

    function processMedia(source, targetPath, item) {
        let name;
        const {cid, iid, target} = setup(targetPath, item);
        item.media = item.media.map(media => {
            media.files = media.files.map(file => {
                try {
                    return copyToTarget({cid, iid, source, target, file});
                } catch (e) {}
            });
            media.files = compact(media.files);
            ['eaf', 'trs', 'ixt', 'flextext'].forEach(t => {
                media[t] = media[t].map(file => {
                    try {
                        const url = copyToTarget({
                            cid,
                            iid,
                            source,
                            target,
                            file: file.url
                        });
                        return {
                            name: file.name,
                            url
                        };
                    } catch (e) {}
                });
                media[t] = compact(media[t]);
            });
            return media;
        });
        return item;
    }

    function processDocuments(source, targetPath, item) {
        let name;
        const {cid, iid, target} = setup(targetPath, item);
        item.documents = item.documents.map(file => {
            try {
                return copyToTarget({cid, iid, source, target, file});
            } catch (e) {}
        });

        item.documents = compact(item.documents);
        return item;
    }
    function setup(target, item) {
        const cid = item.collectionId;
        const iid = item.itemId;
        target = `${target}/www/repository/${cid}/${iid}`;
        shell.mkdir('-p', target);
        return {cid, iid, target};
    }

    function copyToTarget({cid, iid, source, target, file}) {
        const name = file.split('/').pop();
        target = `${target}/${name}`;
        if (shell.test('-f', `${file}`)) {
            shell.cp(`${file}`, `${target}`);
            return `/repository/${target.split('repository/')[1]}`;
        } else {
            errors.push(`Missing source file: ${file}`);
        }
    }
}

function prepareTarget(target) {
    shell.exec(`rm -rf ${target}/www`);
    shell.mkdir('-p', `${target}/www/repository`);
    shell.mkdir('-p', `${target}/www/cgi-bin`);
}

function buildIndex(items) {
    let index = {};
    const collectionIds = items.map(i => i.collectionId);
    collectionIds.forEach(c => (index[c] = {}));
    items.forEach(item => {
        index[item.collectionId][item.itemId] = readCatalogFile(item);
    });
    return index;
}

function createItemDataStructure(path, data) {
    // console.log(data);
    const files = getFiles(path, data);
    const mediaFiles = compact(
        filterFiles([...types.videoTypes, ...types.audioTypes], files)
    );
    let imageFiles = compact(filterFiles(types.imageTypes, files));
    imageFiles = compact(
        imageFiles.filter(image => !image.name.match('thumb'))
    );
    const imageThumbnails = compact(
        imageFiles.filter(image => image.name.match('thumb'))
    );
    const documentFiles = compact(filterFiles(types.documentTypes, files));
    const transcriptionFiles = compact(
        filterFiles(types.transcriptionTypes, files)
    );
    return {
        citation: get(data.item, 'citation'),
        collectionId: get(data.item, 'identifier').split('-')[0],
        collectionLink: `http://catalog.paradisec.org.au/collections/${get(
            data,
            'collectionId'
        )}`,
        date: get(data.item, 'originationDate'),
        description: get(data.item, 'description'),
        documents: [],
        identifier: [
            get(data.item, 'identifier'),
            get(data.item, 'archiveLink')
        ],
        images: imageFiles.map(image => image.path),
        itemId: get(data.item, 'identifier').split('-')[1],
        media: getMediaData([...mediaFiles]),
        openAccess: get(data.item, 'private') === 'false',
        rights: get(data.item.adminInfo, 'dataAccessConditions'),
        thumbnails: imageThumbnails.map(image => image.path),
        title: get(data.item, 'title'),
        transcriptions: transcriptionFiles.map(t => {
            return {name: t.name, url: t.path};
        })
    };

    function get(leaf, thing) {
        try {
            return leaf[thing]['#text'];
        } catch (e) {
            return '';
        }
    }

    function getFiles(path, data) {
        const collectionId = get(data.item, 'identifier').split('-')[0];
        const itemId = get(data.item, 'identifier').split('-')[1];
        return data.item.files.file.map(file => {
            return {
                name: `${get(file, 'name')}`,
                path: `${path}/${get(file, 'name')}`,
                type: get(file, 'mimeType')
            };
        });
    }

    function filterFiles(types, files) {
        let extension;
        return files.filter(file => {
            extension = file.name.split('.')[1];
            return includes(types, extension);
        });
    }

    function getMediaData(files) {
        files = groupBy(files, f => {
            return f.name.split('.')[0];
        });
        return map(files, (v, k) => {
            // console.log(k, v);
            return {
                name: k,
                files: v.map(f => f.path),
                eaf: [],
                flextext: [],
                ixt: [],
                trs: [],
                type: v[0].type.split('/')[0]
            };
        });
    }
}

function readCatalogFile({dataPath, dataFile}) {
    const data = parseXML(fs.readFileSync(dataFile, {encoding: 'utf8'}));
    return createItemDataStructure(dataPath, data);

    function parseXML(doc) {
        var parser = new DOMParser();
        var xmldoc = parser.parseFromString(doc, 'text/xml');
        return convert(xmldoc);
    }
}

async function buildDataTree(path) {
    let collections, items;
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
                    } has more than 1 Catalog file. Skipping this folder.`
                );
            } else {
                const cid = folder.dataFile[0].split('-')[0];
                const iid = folder.dataFile[0].split('-')[1];
                items.push({
                    dataPath: folder.dataPath,
                    dataFile: `${folder.dataPath}/${folder.dataFile[0]}`,
                    collectionId: cid,
                    itemId: iid
                });
            }
        }
        return {items, errors};
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
        return content.filter(f => f.match(/CAT-PDSC_ADMIN.xml/));
    }
}
