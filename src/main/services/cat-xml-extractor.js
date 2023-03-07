"use strict"

import fsExtraPkg from "fs-extra"
const { readFile } = fsExtraPkg
import path from "path"
const { basename: pathBasename, dirname: pathDirname } = path
import lodashPkg from "lodash"
const { isEmpty, isUndefined, compact, flattenDeep, uniq, uniqBy, orderBy, isArray, sum } =
    lodashPkg
import convert from "./xml-to-json-service.js"
import { DOMParser } from "xmldom"
const types = {
    imageTypes: ["jpg", "jpeg", "png"],
    videoTypes: ["mp4", "webm"],
    audioTypes: ["mp3"],
    documentTypes: ["pdf"],
    transcriptionTypes: ["eaf", "trs", "ixt", "flextext"]
}

export default class CatXmlExtractor {
    constructor({ dataFolder, file }) {
        this.dataFolder = dataFolder
        this.catXmlFile = path.join(dataFolder, file)
    }
    async readCatalogFile() {
        const metadata = this.parseXML(await readFile(this.catXmlFile, { encoding: "utf8" }))
        this.item = metadata.item
        this.collection = metadata.item.collection
        const files = this.getFiles(this.item)
        this.audioFiles = compact(this.filterFiles({ types: types.audioTypes, files }))
        this.videoFiles = compact(this.filterFiles({ types: types.videoTypes, files }))
        let imageFiles = compact(this.filterFiles({ types: types.imageTypes, files }))
        this.documentFiles = compact(this.filterFiles({ types: types.documentTypes, files }))
        this.transcriptionFiles = compact(
            this.filterFiles({ types: types.transcriptionTypes, files })
        )
        imageFiles = compact(imageFiles.filter((image) => !image.name.match("thumb")))
        this.imageFiles = imageFiles.map((image) => {
            let thumbnail = pathBasename(image.path)
            thumbnail = `${thumbnail.split(".")[0]}-thumb-PDSC_ADMIN.${thumbnail.split(".")[1]}`
            image.thumbnailPath = `${pathDirname(image.path)}/${thumbnail}`
            image.thumbnailRepositoryPath = `${path.dirname(image.repositoryPath)}/${thumbnail}`
            return image
        })
    }
    load() {
        let item = this.createItemDataStructure()
        item.classifications = this.getClassifications()
        item.people = this.getPeople()
        item.languages = this.getItemLanguages()
        item.categories = this.getDataCategories()

        let collection = this.createCollectionDataStructure()
        collection.items = [item.itemId]
        collection.collector = this.getCollectionCollector()
        collection.languages = this.getCollectionLanguages()
        collection.classifications = item.classifications
        collection.categories = item.categories
        collection.people = uniqBy([...item.people, ...this.getCollectionCollector()], "name").map(
            (p) => p.name
        )

        return { item, collection }
    }
    parseXML(doc) {
        var parser = new DOMParser()
        var xmldoc = parser.parseFromString(doc, "text/xml")
        return convert(xmldoc)
    }
    get(leaf, thing) {
        try {
            return leaf[thing]["#text"]
        } catch (e) {
            return ""
        }
    }
    getFiles() {
        const collectionId = this.get(this.item, "identifier").split("-")[0]
        const itemId = this.get(this.item, "identifier").split("-")[1]
        if (isUndefined(this.item.files.file)) return []
        if (!isArray(this.item.files.file)) {
            this.item.files.file = [this.item.files.file]
        }
        if (isEmpty(this.item.files.file)) return []
        const repositoryPath = `/repository/${collectionId}/${itemId}`

        return this.item.files.file.map((file) => {
            const filename = this.get(file, "name")
            const mimetype = this.get(file, "mimeType")
            return {
                name: filename,
                path: `${this.dataFolder}/${filename}`,
                repositoryPath: `${repositoryPath}/${filename}`,
                type: mimetype
            }
        })
    }
    createCollectionDataStructure() {
        let data = {
            title: this.get(this.item.collection, "title"),
            description: this.get(this.item.collection, "description"),
            collectionId: this.get(this.item.collection, "identifier")
        }
        data.collectionLink = `http://catalog.paradisec.org.au/collections/${data.collectionId}`
        return data
    }
    createItemDataStructure() {
        let data = {
            citation: this.get(this.item, "citation"),
            identifier: [this.get(this.item, "identifier"), this.get(this.item, "archiveLink")],
            itemId: this.get(this.item, "identifier").split("-")[1],
            collectionId: this.get(this.item, "identifier").split("-")[0],
            date: this.get(this.item, "originationDate"),
            description: this.get(this.item, "description"),
            images: this.imageFiles,
            audio: this.audioFiles,
            video: this.videoFiles,
            transcriptions: this.transcriptionFiles,
            documents: this.documentFiles,
            openAccess: this.get(this.item, "private") === "false",
            rights: this.get(this.item.adminInfo, "dataAccessConditions"),
            region: this.get(this.item, "region" || ""),
            title: this.get(this.item, "title")
        }
        data.collectionLink = `http://catalog.paradisec.org.au/collections/${data.collectionId}`
        data.elements = sum(
            ["documents", "images", "audio", "video"].map((element) => {
                return data[element].length
            })
        )

        return data
    }
    filterFiles({ files, types }) {
        let extension
        return files.filter((file) => {
            extension = file.name.split(".")[1]
            return types.includes(extension.toLowerCase())
        })
    }
    getCollectionCollector() {
        if (!this.item.collection.collector) return {}
        return [
            {
                role: "collector",
                name: this.item.collection.collector["#text"]
            }
        ]
    }
    getClassifications() {
        let classifications = this.get(this.item.adminInfo, "adminComment")
        if (classifications && classifications.match(/\[.*\]/)) {
            classifications = classifications.replace("[", "").replace("]", "").split(":::")
            classifications = compact(classifications.map((c) => (c !== "" ? c.trim() : undefined)))
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
    getPeople() {
        if (!this.item.agents.agent) {
            return []
        }
        if (!isArray(this.item.agents.agent)) {
            this.item.agents.agent = [this.item.agents.agent]
        }
        let agents = this.item.agents.agent.map((agent) => {
            return {
                role: agent["@attributes"].role,
                name: agent["#text"].trim()
            }
        })
        return orderBy(agents, ["name"])
    }
    getItemLanguages() {
        let languages = []
        languages.push(this.item.language["#text"])
        ;["subjectLanguages", "contentLanguages"].forEach((languageType) => {
            if (isArray(this.item[languageType].language)) {
                languages.push(
                    this.item[languageType].language.map((language) => language["#text"])
                )
            } else {
                if (this.item[languageType.language])
                    languages.push(this.item[languageType].language["#text"])
            }
        })

        languages = flattenDeep(languages)
        languages = compact(languages)
        languages = uniq(languages)
        return languages.sort()
    }
    getCollectionLanguages() {
        let languages = []
        if (!isArray(this.collection.languages.language))
            this.collection.languages.language = [this.collection.languages.language]
        this.collection.languages.language.forEach((language) => {
            languages.push(language["#text"])
        })

        languages = flattenDeep(languages)
        languages = compact(languages)
        languages = uniq(languages)
        return languages.sort()
    }
    getDataCategories() {
        let categories = []
        if (isArray(this.item.dataCategories.category)) {
            categories.push(this.item.dataCategories.category.map((c) => c["#text"]))
        } else {
            if (this.item.dataCategories.category)
                categories.push(this.item.dataCategories.category["#text"])
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
