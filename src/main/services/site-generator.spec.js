"use strict"

import fsExtraPkg from "fs-extra"
const { remove, ensureDir, pathExists, readdir } = fsExtraPkg
import lodashPkg from "lodash"
const { compact } = lodashPkg
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
    it("should be able to create a static site with one item", async () => {
        let result = await dataloader.prepareTarget()
        const { objects, errors } = await dataloader.walk()
        let { items, collections } = await dataloader.buildIndex({ objects })
        const siteGenerator = new SiteGenerator({
            items,
            usbMountPoint,
            applicationPath
        })

        let item = items[0]
        item = await siteGenerator.stripMissingFiles({ item })
        expect(item.images.length).toEqual(3)
        expect(item.media.length).toEqual(2)
        expect(item.documents.length).toEqual(0)

        item.people = compact(
            item.people.map((person) => {
                if (includes(speakerRolesToDisplay, person.role)) return person
            })
        )
        expect(item.people).toEqual([])

        item.path = `${usbMountPoint}/html/${item.collectionId}/${item.itemId}`

        // check site setup correctly
        await siteGenerator.setupSite({ item })
        for (let p of ["assets", "files", "information", "images", "media", "documents"]) {
            expect(await pathExists(path.join(item.path, p))).toBeTrue
        }
        expect(await pathExists(path.join(item.path, "assets", "styles.css"))).toBeTrue
        expect(await pathExists(path.join(item.path, "assets", "bootstrap.min.css"))).toBeTrue
        expect(await pathExists(path.join(item.path, "assets", "fontawesome.js"))).toBeTrue

        // check file browser page setup correctly
        await siteGenerator.createFileBrowserPage({ item })
        expect(await pathExists(path.join(item.path, "files", "index.html")))

        // check image pages setup correctly
        await siteGenerator.createImageBrowserPage({ item })
        let folder = path.join(item.path, "images", "content")
        expect(await pathExists(folder)).toBeTrue
        expect((await readdir(folder)).length).toEqual(6)

        folder = path.join(item.path, "images")
        expect(await pathExists(folder)).toBeTrue
        expect((await readdir(folder)).length).toEqual(4)

        // check media pages setup correctly
        await siteGenerator.createMediaBrowserPage({ item })
        folder = path.join(item.path, "media", "content")
        expect(await pathExists(folder)).toBeTrue
        expect((await readdir(folder)).length).toEqual(2)

        folder = path.join(item.path, "media")
        expect(await pathExists(folder)).toBeTrue
        expect((await readdir(folder)).length).toEqual(3)

        // check document pages setup correctly
        await siteGenerator.createDocumentsBrowserPage({ item })
        folder = path.join(item.path, "documents", "content")
        expect(await pathExists(folder)).toBeTrue
        expect((await readdir(folder)).length).toEqual(0)

        folder = path.join(item.path, "documents")
        expect(await pathExists(folder)).toBeTrue
        expect((await readdir(folder)).length).toEqual(1)

        // check index page created
        await siteGenerator.createIndexPage()
        expect(await pathExists(path.join(item.path, "index.html"))).toBeTrue

        // run the generate command to be sure there are no errors
        await siteGenerator.generate()
    })
})
