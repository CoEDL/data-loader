"use strict"

import EventEmitter from "events"
import fsExtraPkg from "fs-extra"
const { ensureDir, pathExists, copy, writeFile } = fsExtraPkg
import { basename } from "path"
import nunjucks from "nunjucks"
import lodashPkg from "lodash"
const { uniqBy, isEmpty, compact, groupBy, includes, findIndex } = lodashPkg

const speakerRolesToDisplay = ["participant", "performer", "signer", "singer", "speaker"]

export default class SiteGenerator extends EventEmitter {
    constructor({ index, usbMountPoint, applicationPath }) {
        super()

        this.index = index
        this.usbMountPoint = `${usbMountPoint}/html`
        this.applicationPath = applicationPath
    }

    async generate() {
        this.emit("progress", { n: 0, total: this.index.length })
        for (let item of this.index) {
            this.emit("progress", {
                n: findIndex(this.index, {
                    collectionId: item.collectionId,
                    itemId: item.itemId
                }),
                total: this.index.length
            })
            item = await this.stripMissingFiles({ item })
            item.people = compact(
                item.people.map((person) => {
                    if (includes(speakerRolesToDisplay, person.role)) return person
                })
            )
            item.path = `${this.usbMountPoint}/${item.collectionId}/${item.itemId}`
            this.emit("info", `Setting up data path for ${item.collectionId}/${item.itemId}`)
            await this.setupSite({ item })
            this.emit("info", `Creating file browser for ${item.collectionId}/${item.itemId}`)
            await this.createFileBrowserPage({ item })
            this.emit("info", `Creating image browser for ${item.collectionId}/${item.itemId}`)
            await this.createImageBrowserPage({ item })
            this.emit("info", `Creating media browser ${item.collectionId}/${item.itemId}`)
            await this.createMediaBrowserPage({ item })
            this.emit("info", `Creating documents browser ${item.collectionId}/${item.itemId}`)
            await this.createDocumentsBrowserPage({ item })
            this.emit("info", `Done generating ${item.collectionId}/${item.itemId}`)
        }
        this.emit("progress", { n: this.index.length, total: this.index.length })
        await this.createIndexPage()
    }

    async stripMissingFiles({ item }) {
        item.images = compact(
            item.images.map((image) => {
                if (pathExists(image.path)) return image
                this.emit(
                    "error",
                    `${item.collectionId} / ${item.itemId} missing file: ${image.path}`
                )
            })
        )
        item.media = [...item.audio, ...item.video]
        item.media = compact(
            item.media.map(async (m) => {
                if (pathExists(m.path)) return m.path
                this.emit("error", `${item.collectionId} / ${item.itemId} missing file: ${m.file}`)
                if (!isEmpty(m.files)) return m
            })
        )
        item.documents = compact(
            item.documents.map(async (document) => {
                if (pathExists(document.path)) return document
                this.emit(
                    "error",
                    `${item.collectionId} / ${item.itemId} missing file: ${document.path}`
                )
            })
        )
        return item
    }

    getPath(file) {
        return `${this.applicationPath}/templates/${file}`
    }

    async setupSite({ item }) {
        await ensureDir(item.path)
        let contentTypes = ["assets", "files", "information", "images", "media", "documents"]
        contentTypes.forEach(async (component) => {
            await ensureDir(`${item.path}/${component}`)
        })
        await copy(this.getPath("styles.css"), `${item.path}/assets/styles.css`)
        await copy(this.getPath("bootstrap.min.css"), `${item.path}/assets/bootstrap.min.css`)
        await copy(this.getPath("fontawesome.min.js"), `${item.path}/assets/fontawesome.js`)
    }

    async createIndexPage() {
        ensureDir(`${this.usbMountPoint}/assets`)
        await copy(this.getPath("styles.css"), `${this.usbMountPoint}/assets/styles.css`)
        await copy(
            this.getPath("bootstrap.min.css"),
            `${this.usbMountPoint}/assets/bootstrap.min.css`
        )
        await copy(
            this.getPath("fontawesome.min.js"),
            `${this.usbMountPoint}/assets/fontawesome.js`
        )
        const file = `${this.usbMountPoint}/index.html`
        const template = this.getPath("index.njk")
        let data = {
            byIdentifier: groupByIdentifier(this.index),
            byGenre: isEmpty(groupByGenre(this.index)) ? undefined : groupByGenre(this.index),
            bySpeaker: isEmpty(groupBySpeaker(this.index)) ? undefined : groupBySpeaker(this.index)
        }
        const html = nunjucks.render(template, { data })
        await writeFile(file, html)

        function groupByIdentifier(index) {
            let collections = groupBy(index, "collectionId")
            var ordered = {}
            Object.keys(collections)
                .sort()
                .forEach(function (key) {
                    ordered[key] = uniqBy(collections[key], "itemId")
                })

            return ordered
        }

        function groupByGenre(data) {
            let genre
            let collections = data.filter((item) => item.classifications)
            // collections = groupBy(collections, collection => {
            //     genre = collection.classifications.filter(c => c.genre)[0]
            //         .genre;
            //     return genre;
            // });
            var ordered = {}
            Object.keys(collections)
                .sort()
                .forEach(function (key) {
                    ordered[key] = collections[key]
                })

            return ordered
        }

        function groupBySpeaker(data) {
            let collectionsBySpeaker = {}
            let people, speakerRole
            let collections = data.filter((item) => item.people)
            collections.forEach((collection) => {
                people = collection.people.filter((speaker) =>
                    includes(speakerRolesToDisplay, speaker.role)
                )
                people.forEach((person) => {
                    speakerRole = `${person.name} (${person.role})`
                    if (!collectionsBySpeaker[speakerRole]) collectionsBySpeaker[speakerRole] = []
                    collectionsBySpeaker[speakerRole].push(collection)
                })
            })
            var ordered = {}
            Object.keys(collectionsBySpeaker)
                .sort()
                .forEach(function (key) {
                    ordered[key] = uniqBy(collectionsBySpeaker[key], ["collectionId", "itemId"])
                })

            return ordered
        }
    }

    async createFileBrowserPage({ item }) {
        const file = `${item.path}/files/index.html`
        const template = this.getPath("file-browser.njk")
        const html = nunjucks.render(template, item)
        await writeFile(file, html)
    }

    async createImageBrowserPage({ item }) {
        await ensureDir(`${item.path}/images/content`)
        for (let i = 0; i < item.images.length; i++) {
            const first = `${item.images[0].path.split("/").pop()}.html`
            const last = `${item.images[item.images.length - 1].path.split("/").pop()}.html`
            let image = item.images[i]
            item.currentContext = {
                first: i === 0 ? null : first,
                previous: i === 0 ? null : `${item.images[i - 1].path.split("/").pop()}.html`,
                name: `./content/${image.path.split("/").pop()}`,
                meta: `Image ${i + 1} of ${item.images.length}`,
                next:
                    i === item.images.length - 1
                        ? null
                        : `${item.images[i + 1].path.split("/").pop()}.html`,
                last: i === item.images.length - 1 ? null : last
            }
            if (await pathExists(image.path)) {
                await this.copyFile(image.path, `${item.path}/images/content`)
                await this.copyFile(image.thumbnail, `${item.path}/images/content`)

                const file = `${item.path}/images/${image.path.split("/").pop()}.html`
                const template = this.getPath("image-browser.njk")
                const html = nunjucks.render(template, item)
                await writeFile(file, html)
            }
        }
    }

    async createMediaBrowserPage({ item }) {
        await ensureDir(`${item.path}/media/content`)
        let content
        for (let file of item.audio) {
            if (await pathExists(file.path)) {
                await this.copyFile(file.path, `${item.path}/media/content`)
            }
            content = {
                title: item.title,
                description: item.description,
                people: item.people,
                item: file
            }
            file = `${item.path}/media/${file.name}.html`
            const template = this.getPath("audio-browser.njk")
            const html = nunjucks.render(template, content)
            await writeFile(file, html)
        }

        for (let file of item.video) {
            content = {
                title: item.title,
                description: item.description,
                people: item.people,
                item: file
            }
            if (await pathExists(file.path)) {
                await this.copyFile(file.path, `${item.path}/media/content`)
            }
            file = `${item.path}/media/${file.name}.html`
            const template = this.getPath("video-browser.njk")
            const html = nunjucks.render(template, content)
            await writeFile(file, html)
        }
    }

    async createDocumentsBrowserPage({ item }) {
        await ensureDir(`${item.path}/documents/content`)
        for (let document of item.documents) {
            if (await pathExists(document.path)) {
                await this.copyFile(document.path, `${item.path}/documents/content`)
            }
        }
    }

    async copyFile(source, target) {
        let filename = basename(source)
        try {
            await copy(source, `${target}/${filename}`)
        } catch (error) {
            // do nothing
        }
    }
}
