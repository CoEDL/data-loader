"use strict"

import fsExtraPkg from "fs-extra"
const { remove, ensureDir, pathExists } = fsExtraPkg
import path from "path"
import DataLoader from "./data-service.js"
import SiteGenerator from "./site-generator"
import Chance from "chance"
const chance = new Chance()

describe("test static site generation capability", () => {
    let dataloader
    const applicationPath = __dirname
    const localDataPath = path.join(__dirname, "test-data")
    let usbMountPoint
    beforeEach(async () => {
        usbMountPoint = path.join(__dirname, "test-output", chance.word())
        dataloader = new DataLoader({
            usbMountPoint,
            localDataPath,
            applicationPath
        })
        await ensureDir(usbMountPoint)
    })
    afterAll(async () => {
        await remove(path.join(__dirname, "test-output"))
    })
    it("should be able to create a static site", async () => {
        let result = await dataloader.prepareTarget()
        const { folders, errors } = await dataloader.walk()
        let { items, collections } = await dataloader.buildIndex({ folders })
        const siteGenerator = new SiteGenerator({
            index: items,
            usbMountPoint,
            applicationPath
        })

        // siteGenerator.on("info", (msg) => {
        //     console.log(msg)
        // })
        await siteGenerator.generate()
        items.forEach(async (item) => {
            const path = `${usbMountPoint}/catalog/${item.collectionId}/${item.itemId}`
            expect(await pathExists(path)).toBeTrue
            let contentTypes = ["files", "information", "images", "media", "documents"]
            contentTypes.forEach(async (component) => {
                expect(await pathExists(`${path}/${component}`)).toBeTrue
            })
        })
    })
})
