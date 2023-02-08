"use strict"

import EventEmitter from "events"
import fsExtraPkg from "fs-extra"
const { ensureDir, pathExists, remove, readdir, copy, readFile, writeFile, stat } = fsExtraPkg
import path from "path"
const { basename: pathBasename, dirname: pathDirname } = path
import SiteGenerator from "./site-generator.js"
import { walk as walker } from "@root/walk"
import lodashPkg from "lodash"
const { isEmpty, isUndefined, compact, flattenDeep, uniq, uniqBy, groupBy, orderBy, isArray, sum } =
    lodashPkg
import convert from "./xml-to-json-service.js"
import { DOMParser } from "xmldom"

const ocflObjectFile = "0=ocfl_object_1.0"
const types = {
    imageTypes: ["jpg", "jpeg", "png"],
    videoTypes: ["mp4", "ogg", "ogv", "mov", "webm"],
    audioTypes: ["mp3", "ogg", "oga"],
    documentTypes: ["pdf"],
    transcriptionTypes: ["eaf", "trs", "ixt", "flextext"]
}

export default class DataLoader extends EventEmitter {
    constructor({ targetDevice, localDataPath, usbMountPoint, applicationPath }) {
        super()
        this.targetDevice = targetDevice
        this.localDataPath = localDataPath
        this.usbMountPoint = usbMountPoint
        this.applicationPath = applicationPath
    }

    async load() {
        try {
            if (!(await this.prepareTarget())) {
                return
            }

            this.emit("info", "Processing the data to be loaded.")
            let { objects, errors } = await this.walk()
            this.emit("complete", "Data processed")
            if (!objects.length) {
                this.emit("error", "No data folders found.")
                return
            }

            errors.forEach((error) => this.emit("error", error))

            this.emit("info", "Building the index.")
            const { collections, items } = await this.buildIndex({ objects })
            this.emit("complete", "Index built")

            switch (this.targetDevice) {
                case "Raspberry Pi":
                    await this.installCollectionViewer()
                    await this.installTheData({ collections, items })
                    break

                case "USB Disk":
                    this.emit("info", "Generating the site.")
                    const siteGenerator = new SiteGenerator({
                        index: items,
                        usbMountPoint: this.usbMountPoint,
                        applicationPath: this.applicationPath
                    })
                    await siteGenerator.generate()
                    this.emit("info", "Site generation complete")
                    break
            }

            this.emit("complete", "Done.")
        } catch (error) {
            console.log("****", error)
            this.emit("error", error.message)
        }
    }

    async prepareTarget() {
        try {
            this.emit("info", `Preparing the target device`)
            await remove(`${this.usbMountPoint}/html`)
            await ensureDir(`${this.usbMountPoint}/html`)
            this.emit("complete", `Device ready for loading`)
            return true
        } catch (error) {
            this.emit("info", `There was a problem preparing the device for loading`)
            return false
        }
    }

    async installCollectionViewer() {
        this.emit("info", `Installing the collection viewer`)
        const source = path.join(this.applicationPath, "viewer/")
        const target = `${this.usbMountPoint}/html/`
        await copy(source, target)
        await ensureDir(`${this.usbMountPoint}/html/repository`)
        this.emit("complete", `Collection viewer has been installed`)
    }

    async buildIndex({ objects }) {
        var self = this
        let items = []
        let collections = []
        for (let obj of objects) {
            if (obj.type === "CAT-XML") {
                let { item, collection } = await readCatalogFile({ obj })
                // console.log(JSON.stringify(item, null, 2));
                // console.log(JSON.stringify(collection, null, 2));
                if (!item) {
                    continue
                }

                this.emit(
                    "info",
                    `Generated the index for item: ${item.collectionId}/${item.itemId}`
                )
                item.fs = obj
                items.push(item)

                this.emit("info", `Generated the index for collection: ${collection.collectionId}`)
                collections.push(collection)
            }
        }
        collections = groupBy(collections, "collectionId")
        const collectionIds = Object.keys(collections)
        for (let collectionId of collectionIds) {
            let collection = collections[collectionId]
            const items = flattenDeep(collection.map((c) => c.items))
            const classifications = uniqBy(
                flattenDeep(collection.map((c) => c.classifications)),
                "value"
            )
            const people = uniqBy(flattenDeep(collection.map((c) => c.people)), "name")
            collections[collectionId] = {
                ...collection[0],
                people,
                classifications,
                items
            }
        }
        collections = collectionIds.map((collectionId) => collections[collectionId])

        return { items, collections }

        async function readCatalogFile({ obj }) {
            let dataFile = path.join(obj.folder, obj.file)
            const data = parseXML(await readFile(dataFile, { encoding: "utf8" }))
            let { people, classifications, languages, categories } = getFilters({
                data
            })
            let item = createItemDataStructure({ obj, data })
            if (!item) {
                self.emit("error", `No files listed in ${dataFile}`)
                return { item: null, collection: null }
            }
            item = { ...item, people, classifications, languages, categories }

            let collection = createCollectionDataStructure({ data })
            collection.people = uniqBy([...getCollectionPeople({ data }), ...people], "name")
            collection.classifications = classifications
            collection.languages = languages
            collection.categories = categories
            collection.items = [item.itemId]

            return { item, collection }

            function parseXML(doc) {
                var parser = new DOMParser()
                var xmldoc = parser.parseFromString(doc, "text/xml")
                return convert(xmldoc)
            }
        }

        function createCollectionDataStructure({ data }) {
            let collectionData = {
                title: get(data.item.collection, "title"),
                description: get(data.item.collection, "description"),
                collectionId: get(data.item.collection, "identifier")
            }
            function get(leaf, thing) {
                try {
                    return leaf[thing]["#text"] || ""
                } catch (e) {
                    return ""
                }
            }
            return collectionData
        }

        function createItemDataStructure({ obj, data }) {
            const files = getFiles(data)
            if (isEmpty(files)) {
                return null
            }
            const audioFiles = compact(filterFiles({ types: types.audioTypes, files }))
            const videoFiles = compact(filterFiles({ types: types.videoTypes, files }))
            let imageFiles = compact(filterFiles({ types: types.imageTypes, files }))
            imageFiles = compact(imageFiles.filter((image) => !image.name.match("thumb")))
            imageFiles = imageFiles.map((image) => {
                let thumbnail = pathBasename(image.path)
                thumbnail = `${thumbnail.split(".")[0]}-thumb-PDSC_ADMIN.${thumbnail.split(".")[1]}`
                image.thumbnail = `${pathDirname(image.path)}/${thumbnail}`
                return image
            })
            const documentFiles = compact(filterFiles({ types: types.documentTypes, files }))
            const transcriptionFiles = compact(
                filterFiles({ types: types.transcriptionTypes, files })
            )

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
                identifier: [get(data.item, "identifier"), get(data.item, "archiveLink")],
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
                region: get(data.item, "region" || ""),
                title: get(data.item, "title"),
                transcriptions: transcriptionFiles.map((t) => {
                    return { name: t.name, path: t.path }
                })
            }
            data.elements = sum(
                ["documents", "images", "audio", "video"].map((element) => {
                    return data[element].length
                })
            )

            return data

            function get(leaf, thing) {
                try {
                    return leaf[thing]["#text"]
                } catch (e) {
                    return ""
                }
            }

            function getFiles(data) {
                const collectionId = get(data.item, "identifier").split("-")[0]
                const itemId = get(data.item, "identifier").split("-")[1]
                if (isUndefined(data.item.files.file)) return []
                if (!isArray(data.item.files.file)) {
                    data.item.files.file = [data.item.files.file]
                }
                if (isEmpty(data.item.files.file)) return []
                const target = `/repository/${collectionId}/${itemId}`

                return data.item.files.file.map((file) => {
                    const filename = get(file, "name")
                    const mimetype = get(file, "mimeType")
                    return {
                        name: filename,
                        path: `${target}/${filename}`,
                        type: mimetype
                    }
                })
            }

            function filterFiles({ files, types }) {
                let extension
                return files.filter((file) => {
                    extension = file.name.split(".")[1]
                    return types.includes(extension.toLowerCase())
                })
            }

            function getMediaData({ files, type }) {
                files = filter(files, type)
                return files.map((file) => {
                    return {
                        name: file.split("/").pop(),
                        path: file
                    }
                })

                function filter(files, what) {
                    if (what === "audio") {
                        const set = types.audioTypes
                        files = files.filter((file) => {
                            return set.includes(file.name.split(".")[1])
                        })
                        return files.map((file) => file.path)
                    } else if (what === "video") {
                        const set = types.videoTypes
                        files = files.filter((file) => {
                            return set.includes(file.name.split(".")[1])
                        })
                        return files.map((file) => file.path)
                    } else {
                        files = files.filter((file) => {
                            return file.name.split(".")[1] === what
                        })
                        return files.map((file) => {
                            return {
                                name: file.name,
                                url: file.path
                            }
                        })
                    }
                }
            }
        }

        function getCollectionPeople({ data }) {
            if (!data.item.collection.collector) {
                return {}
            }
            return [
                {
                    role: "collector",
                    name: data.item.collection.collector["#text"]
                }
            ]
        }

        function getFilters({ data }) {
            const classifications = getClassifications({ data })
            const people = getPeople({ data })
            const languages = getLanguages({ data })
            const categories = getDataCategories({ data })
            return { people, classifications, languages, categories }

            function get(leaf, thing) {
                try {
                    return leaf[thing]["#text"]
                } catch (e) {
                    return ""
                }
            }

            function getClassifications({ data }) {
                let classifications = get(data.item.adminInfo, "adminComment")
                if (classifications && classifications.match(/\[.*\]/)) {
                    classifications = classifications.replace("[", "").replace("]", "").split(":::")
                    classifications = compact(
                        classifications.map((c) => (c !== "" ? c.trim() : undefined))
                    )
                    classifications = classifications.map((c) => {
                        return {
                            name: c.split(":")[0],
                            value: c.split(":")[1].trim()
                        }
                    })
                } else {
                    classifications = []
                }
                return classifications
            }

            function getPeople({ data }) {
                if (!data.item.agents.agent) {
                    return []
                }
                if (!isArray(data.item.agents.agent)) {
                    data.item.agents.agent = [data.item.agents.agent]
                }
                let agents = data.item.agents.agent.map((agent) => {
                    return {
                        role: agent["@attributes"].role,
                        name: agent["#text"].trim()
                    }
                })
                return orderBy(agents, ["name"])
            }

            function getLanguages({ data }) {
                let languages = []
                languages.push(data.item.language["#text"])
                ;["subjectLanguages", "contentLanguages"].forEach((languageType) => {
                    if (isArray(data.item[languageType].language)) {
                        languages.push(
                            data.item[languageType].language.map((language) => language["#text"])
                        )
                    } else {
                        if (data.item[languageType.language])
                            languages.push(data.item[languageType].language["#text"])
                    }
                })

                languages = flattenDeep(languages)
                languages = compact(languages)
                languages = uniq(languages)
                return languages.sort()
            }

            function getDataCategories({ data }) {
                let categories = []
                if (isArray(data.item.dataCategories.category)) {
                    categories.push(data.item.dataCategories.category.map((c) => c["#text"]))
                } else {
                    if (data.item.dataCategories.category)
                        categories.push(data.item.dataCategories.category["#text"])
                }
                categories = flattenDeep(categories)
                categories = compact(categories)
                if (categories.includes("instrumental music") || categories.includes("song")) {
                    categories = ["music"]
                } else {
                    categories = []
                }
                return categories
            }
        }
    }

    async installTheData({ collections, items }) {
        let target = `${this.usbMountPoint}/html/repository`
        this.emit("info", "Loading the data (this can take some time).")

        let processedItems = []

        for (let [idx, item] of items.entries()) {
            // remap file paths to path on target
            let contentTypes = ["documents", "images", "audio", "video", "transcription"]
            contentTypes.forEach((type) => {
                if (item[type]) {
                    item[type] = item[type].map((file) => {
                        file.path = file.path.replace(this.localDataPath, `/repository`)
                        if (file.thumbnail) {
                            file.thumbnail = file.thumbnail.replace(
                                this.localDataPath,
                                `/repository`
                            )
                        }
                        return file
                    })
                }
            })
            this.emit("info", `Loading item ${item.collectionId}/${item.itemId}`)

            const source = item.fs.folder
            const target = `${this.usbMountPoint}/html/repository/${item.collectionId}/${item.itemId}/`

            if (await pathExists(source)) {
                await ensureDir(target)
                await copy(source, target)
                processedItems.push(item)
            }
        }
        this.emit("complete", "Data loaded")
        await this.writeIndexFile({
            target,
            items: processedItems,
            collections
        })
        return { items, collections }
    }

    async writeIndexFile({ target, collections, items }) {
        await writeFile(`${target}/index.json`, JSON.stringify({ collections, items }), "utf8")
        this.emit("info", "Index file written.")
    }

    async walk() {
        let errors = []
        let objects = []
        await walker(this.localDataPath, walkHandler)

        async function walkHandler(error, pathname, dirent) {
            let isDirectory = await (await stat(pathname)).isDirectory()
            if (error) {
                errors.push(error)
            } else {
                if (isDirectory) {
                    objects.push(await scandir({ folder: pathname }))
                }
            }
        }

        return { objects: compact(objects), errors }

        async function scandir({ folder }) {
            let content = await readdir(folder)
            let files = containsCatXMLFile({ content })
            if (!files.length) return null
            if (files.length !== 1) {
                errors.push({
                    msg: `${folder} has more than one CAT XMl file.`,
                    level: "error"
                })
                return null
            }
            return { folder, type: "CAT-XML", file: files[0] }
        }

        function containsCatXMLFile({ content }) {
            let files = content
                .filter((f) => f.match(/CAT-PDSC_ADMIN\.xml/))
                .filter((f) => !f.match(/^\..*/))
            return files
        }
    }
}
