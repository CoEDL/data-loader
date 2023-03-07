"use strict"

import EventEmitter from "events"
import fsExtraPkg from "fs-extra"
const { ensureDir, pathExists, remove, readdir, copy, writeFile, stat } = fsExtraPkg
import path from "path"
import SiteGenerator from "./site-generator.js"
import { walk as walker } from "@root/walk"
import lodashPkg from "lodash"
const { compact, uniqBy, uniq } = lodashPkg
import CatXmlExtractor from "./cat-xml-extractor.js"

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
            const { collections, items, itemLocation } = await this.buildIndex({ objects })
            this.emit("complete", "Index built")

            switch (this.targetDevice) {
                case "Raspberry Pi":
                    await this.installCollectionViewer()
                    await this.installTheData({ collections, items, itemLocation })
                    break

                case "USB Disk":
                    this.emit("info", "Generating the site.")
                    const siteGenerator = new SiteGenerator({
                        items,
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
        let items = []
        let collectionData = []
        let itemLocation = {}
        for (let obj of objects) {
            let extractor = new CatXmlExtractor({
                dataFolder: obj.folder,
                file: obj.file
            })

            this.emit("info", `Generating the index for item: ${obj.folder}`)
            let item, collection
            try {
                await extractor.readCatalogFile()
                ;({ item, collection } = extractor.load())
            } catch (error) {
                console.log(error)
                this.emit("error", `Error generating the index for item: ${obj.folder}`)
                continue
            }
            this.emit(
                "complete",
                `Generated the index for item: ${item.collectionId}/${item.itemId}`
            )

            items.push(item)
            itemLocation[`${item.collectionId}-${item.itemId}`] = obj
            collectionData.push(collection)
        }
        let collections = {}
        collectionData.forEach((collection) => {
            if (!collections[collection.collectionId]) {
                collections[collection.collectionId] = { ...collection }
            } else {
                collections[collection.collectionId].items = [
                    ...collections[collection.collectionId].items,
                    ...collection.items
                ]
                for (let group of ["people", "classifications", "categories"]) {
                    collections[collection.collectionId][group] = [
                        ...collections[collection.collectionId][group],
                        ...collection[group]
                    ]
                    collections[collection.collectionId].people = uniq(
                        collections[collection.collectionId].people
                    )
                    collections[collection.collectionId].categories = uniq(
                        collections[collection.collectionId].categories
                    )
                    collections[collection.collectionId].classifications = uniqBy(
                        collections[collection.collectionId].classifications,
                        "name"
                    )
                }
            }
        })
        collections = Object.keys(collections).map((id) => collections[id])

        return { items, itemLocation, collections }
    }

    async installTheData({ collections, items, itemLocation }) {
        let target = `${this.usbMountPoint}/html/repository`
        this.emit("info", "Loading the data (this can take some time).")

        let processedItems = []

        for (let item of items) {
            this.emit("info", `Loading item ${item.collectionId}/${item.itemId}`)

            const source = itemLocation[`${item.collectionId}-${item.itemId}`].folder
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

        objects = compact(objects)
        objects = uniqBy(objects, "file")
        return { objects, errors }

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
