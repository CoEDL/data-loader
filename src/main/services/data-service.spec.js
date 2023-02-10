"use strict"

import fsExtraPkg from "fs-extra"
const { remove, ensureDir, readdir, pathExistsSync } = fsExtraPkg
import path from "path"
import DataLoader from "./data-service.js"
import Chance from "chance"
const chance = new Chance()

describe("test data service methods", () => {
    let dataloader
    const applicationPath = __dirname
    const targetDevice = "Raspberry Pi"
    const localDataPath = path.join(__dirname, "test-data")
    let usbMountPoint
    beforeEach(async () => {
        usbMountPoint = path.join(__dirname, "test-output", chance.word())
        dataloader = new DataLoader({
            usbMountPoint,
            targetDevice,
            localDataPath,
            applicationPath
        })
        await ensureDir(usbMountPoint)
    })
    afterAll(async () => {
        await remove(path.join(__dirname, "test-output"))
    })
    it("should be able to prepare the target device for data loading", async () => {
        let result = await dataloader.prepareTarget()
        expect(result).toBeTrue
        let content = await readdir(usbMountPoint)
        expect(content).toEqual(["html"])
    })
    it("should be able to install the collection viewer", async () => {
        await dataloader.prepareTarget()
        await dataloader.installCollectionViewer()
        const content = await readdir(`${usbMountPoint}/html`)
        expect(content.includes("index.html")).toBeTrue
        expect(content.includes("repository")).toBeTrue
        expect(content.includes("main.28c169d6686d669ae13d.bundle.js")).toBeTrue
        expect(content.includes("main.371542c5241e82ac4fbc.css")).toBeTrue
        expect(content.includes("vendors.0da94467cde34b98bca5.css")).toBeTrue
        expect(content.includes("vendors.3bef3c76f1c2f6d6049e.bundle.js")).toBeTrue
    })
    it("should be able to build a tree of data files to load", async () => {
        await dataloader.prepareTarget()
        const { objects, errors } = await dataloader.walk()
        expect(objects.length).toEqual(5)
        const folder = objects.filter((f) => f.file === "DT1-214-CAT-PDSC_ADMIN.xml")
        expect(folder).toMatchObject([
            {
                type: "CAT-XML",
                file: "DT1-214-CAT-PDSC_ADMIN.xml"
            }
        ])
    })
    it("should be able to create an index file with all of the data", async () => {
        let result = await dataloader.prepareTarget()
        const { objects, errors } = await dataloader.walk()
        let { items, collections } = await dataloader.buildIndex({ objects })
        expect(items.length).toEqual(5)
        expect(collections.length).toEqual(3)
        const itemIds = items.map((item) => item.itemId).sort()
        expect(itemIds).toEqual(["214", "521", "940", "98007", "TokelauOf"])
        expect(collections.map((c) => c.collectionId).sort()).toEqual(["DT1", "NT1", "NT5"])
        let item = items.filter((i) => i.itemId === "98007")[0]
        expect(item.languages).toEqual(["Bislama - bis", "Efate, South - erk", "Nafsan"])
        item = items.filter((i) => i.itemId === "940")[0]
        expect(item.categories).toEqual(["music"])
    })
    it("should be able to install the data and write the index file", async () => {
        let result = await dataloader.prepareTarget()
        await dataloader.installCollectionViewer()
        const { objects, errors } = await dataloader.walk()

        let { items, collections, itemLocation } = await dataloader.buildIndex({ objects })

        let messages = []
        dataloader.on("info", (msg) => messages.push(msg))
        dataloader.on("complete", (msg) => messages.push(msg))
        dataloader.on("error", (msg) => messages.push(msg))
        const index = await dataloader.installTheData({
            collections,
            items,
            itemLocation
        })

        expect(messages).toEqual([
            "Loading the data (this can take some time).",
            "Loading item DT1/214",
            "Loading item DT1/521",
            "Loading item DT1/940",
            "Loading item NT1/98007",
            "Loading item NT5/TokelauOf",
            "Data loaded",
            "Index file written."
        ])

        index.items.forEach((item) => {
            item.images.forEach((image) => {
                if (image.path) expect(pathExistsSync(image.path)).toBeTrue
                if (image.thumbnailPath) expect(pathExistsSync(image.thumbnail)).toBeTrue
            })
            item.audio.forEach((file) => {
                if (file.path) expect(pathExistsSync(file.path)).toBeTrue
            })
            item.video.forEach((file) => {
                if (file.path) expect(pathExistsSync(file.path)).toBeTrue
            })
            item.transcriptions.forEach((file) => {
                if (file.path) expect(pathExistsSync(file.path)).toBeTrue
            })
            item.documents.forEach((file) => {
                if (file.path) expect(pathExistsSync(file.path)).toBeTrue
            })
            expect(pathExistsSync(`${usbMountPoint}/html/repository/index.json`)).toBeTrue
        })
    })
})
