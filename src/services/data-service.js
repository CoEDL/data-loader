'use strict';

const fs = require('fs-extra');
const util = require('util');
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const copy = util.promisify(fs.copyFile);
const shell = require('shelljs');

const {
    compact,
    flattenDeep,
    includes,
    groupBy,
    map,
    each,
    isArray
} = require('lodash');
const {convert} = require('./xml-to-json-service');
const DOMParser = require('xmldom').DOMParser;

module.exports = {
    buildDataTree,
    readCatalogFile,
    buildIndex,
    prepareTarget,
    installTheData,
    writeIndexFile,
    verifyTargetLibraryBoxDisk,
    installCollectionViewer,
    updateLibraryBoxConfigurationFiles
};

const types = {
    imageTypes: ['jpg', 'jpeg', 'png'],
    videoTypes: ['mp4', 'ogg', 'ogv', 'mov', 'webm'],
    audioTypes: ['mp3', 'ogg', 'oga'],
    documentTypes: ['pdf'],
    transcriptionTypes: ['eaf', 'trs', 'ixt', 'flextext']
};

function updateLibraryBoxConfigurationFiles({target, hostname, ssid}) {
    const originalTarget = target;
    target = `${target}/LibraryBox/Config`;

    try {
        fs.statSync(target).isDirectory();
    } catch (error) {
        throw new Error(
            `${originalTarget} doesn't look like a LibraryBox disk.`
        );
    }
    [
        'librarybox_ftp.txt',
        'librarybox_ftpadmin.txt',
        'librarybox_ftpanon.txt',
        'librarybox_ftpsync.txt',
        'librarybox_shoutbox.txt'
    ].forEach(file => {
        fs.writeFileSync(`${target}/${file}`, 'no\n');
    });

    fs.writeFileSync(`${target}/hostname.txt`, `${hostname}\n`);
    fs.writeFileSync(`${target}/system_hostname.txt`, `${hostname}\n`);
    fs.writeFileSync(`${target}/ssid.txt`, `${ssid}\n`);
}

function writeIndexFile(target, index) {
    fs.writeFileSync(
        `${target}/www/repository/index.json`,
        JSON.stringify(index),
        'utf8'
    );
}

function installTheData({dataPath, target, index, loggers}) {
    return new Promise(async function(resolve, reject) {
        for (let item of index) {
            item.data = await processImages(dataPath, target, item.data);
            item.data = await processTranscriptions(
                dataPath,
                target,
                item.data
            );
            item.data = await processMedia(dataPath, target, item.data);
            item.data = await processDocuments(dataPath, target, item.data);

            const transcriptions = groupBy(item.data.transcriptions, 'name');
            item.data.media = item.data.media.map(media => {
                ['eaf', 'trs', 'ixt', 'flextext'].forEach(t => {
                    media[t] = media[t].map(tw => transcriptions[tw.name][0]);
                });
                return media;
            });
        }
        resolve({index});
    });

    function processImages(source, targetPath, item) {
        return new Promise(async function(resolve, reject) {
            let name;
            const {cid, iid, target} = setup(targetPath, item);
            item.images = await Promise.all(
                item.images.map(async file => {
                    return await copyToTarget({file, target});
                })
            );

            item.thumbnails = await Promise.all(
                item.thumbnails.map(async file => {
                    return await copyToTarget({file, target});
                })
            );
            item.images = compact(item.images);
            item.thumbnails = compact(item.thumbnails);
            resolve(item);
        });
    }

    function processTranscriptions(source, targetPath, item) {
        return new Promise(async function(resolve, reject) {
            let name;
            const {cid, iid, target} = setup(targetPath, item);
            item.transcriptions = await Promise.all(
                item.transcriptions.map(async file => {
                    const url = await copyToTarget({
                        file: file.url,
                        target
                    });
                    return {
                        name: file.name,
                        url
                    };
                })
            );
            item.transcriptions = compact(item.transcriptions);
            resolve(item);
        });
    }

    function processMedia(source, targetPath, item) {
        return new Promise(async function(resolve, reject) {
            let name;
            const {cid, iid, target} = setup(targetPath, item);
            item.media = await Promise.all(
                item.media.map(async media => {
                    media.files = await Promise.all(
                        media.files.map(async file => {
                            return await copyToTarget({target, file});
                        })
                    );
                    media.files = compact(media.files);
                    ['eaf', 'trs', 'ixt', 'flextext'].forEach(async t => {
                        media[t] = await Promise.all(
                            media[t].map(async file => {
                                const url = await copyToTarget({
                                    file: file.url,
                                    target
                                });
                                return {
                                    name: file.name,
                                    url
                                };
                            })
                        );
                        media[t] = compact(media[t]);
                    });
                    return media;
                })
            );
            resolve(item);
        });
    }

    function processDocuments(source, targetPath, item) {
        return new Promise(async function(resolve, reject) {
            let name;
            const {cid, iid, target} = setup(targetPath, item);
            item.documents = await Promise.all(
                item.documents.map(async file => {
                    try {
                        return await copyToTarget({file, target});
                    } catch (e) {}
                })
            );

            item.documents = compact(item.documents);
            resolve(item);
        });
    }

    function setup(target, item) {
        const cid = item.collectionId;
        const iid = item.itemId;
        target = `${target}/www/repository/${cid}/${iid}`;
        shell.mkdir('-p', target);
        return {cid, iid, target};
    }

    async function copyToTarget({target, file}) {
        const name = file.split('/').pop();
        target = `${target}/${name}`;
        if (shell.test('-f', `${file}`)) {
            // shell.cp(`${file}`, `${target}`);
            await copy(file, target);

            loggers.logInfo(`Loaded: ${file}`);
            return `/repository/${target.split('repository/')[1]}`;
        } else {
            loggers.logError(`Missing source file: ${file}`);
        }
    }
}

function prepareTarget(target) {
    fs.removeSync(`${target}/www`);
    fs.ensureDirSync(`${target}/www`);
    fs.ensureDirSync(`${target}/www/repository`);
    // fs.ensureDirSync(`${target}/www/cgi-bin`);
}

function installCollectionViewer(target) {
    fs.copySync(`${__dirname}/../viewer/`, `${target}/www/`);
}

async function verifyTargetLibraryBoxDisk(target) {
    try {
        const folder = await stat(`${target}`);
        return folder.isDirectory();
    } catch (error) {
        return false;
    }
}

function buildIndex(items) {
    return items.map(item => {
        return {
            collectionId: item.collectionId,
            itemId: item.itemId,
            data: readCatalogFile(item)
        };
    });
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
        media: getMediaData([...mediaFiles, ...transcriptionFiles]),
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
        if (!isArray(data.item.files.file)) {
            data.item.files.file = [data.item.files.file];
        }
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
        files = groupBy(files, file => {
            return file.name.split('.')[0];
        });
        return map(files, (v, k) => {
            return {
                name: k,
                files: filter([...v], 'media'),
                eaf: filter([...v], 'eaf'),
                flextext: filter([...v], 'flextext'),
                ixt: filter([...v], 'ixt'),
                trs: filter([...v], 'trs'),
                type: v[0].type.split('/')[0]
            };
        });

        function filter(files, what) {
            if (what === 'media') {
                const set = [...types.videoTypes, ...types.audioTypes];
                files = files.filter(file => {
                    return includes(set, file.name.split('.')[1]);
                });
                return files.map(file => file.path);
            } else {
                files = files.filter(file => {
                    return file.name.split('.')[1] === what;
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
