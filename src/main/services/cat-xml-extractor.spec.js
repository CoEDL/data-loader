"use strict"

import fsExtraPkg from "fs-extra"
const { remove, ensureDir, readdir, pathExistsSync } = fsExtraPkg
import path from "path"
import DataLoader from "./data-service.js"
import Chance from "chance"
const chance = new Chance()
import CatXmlExtractor from "./cat-xml-extractor.js"

describe("test data service methods", () => {
    it("should be able to read and process NT1/98007", async () => {
        let extractor = new CatXmlExtractor({
            dataFolder: path.join(__dirname, "test-data/NT1/98007"),
            file: "NT1-98007-CAT-PDSC_ADMIN.xml"
        })

        await extractor.readCatalogFile()
        const classifications = extractor.getClassifications()
        const people = extractor.getPeople()
        const itemLanguages = extractor.getItemLanguages()
        const categories = extractor.getDataCategories()
        expect(classifications.length).toEqual(0)
        expect(people).toEqual([
            { role: "speaker", name: "Iokopeth" },
            { role: "speaker", name: "John Maklen" },
            { role: "speaker", name: "Kalsarap Namaf" },
            { role: "depositor", name: "Nick Thieberger" },
            { role: "recorder", name: "Nick Thieberger" },
            { role: "speaker", name: "Waia Tenene" }
        ])
        expect(itemLanguages).toEqual(["Bislama - bis", "Efate, South - erk", "Nafsan"])
        expect(categories.length).toEqual(0)

        expect(extractor.videoFiles.length).toEqual(0)
        expect(extractor.audioFiles.length).toEqual(2)
        expect(extractor.documentFiles.length).toEqual(0)
        expect(extractor.transcriptionFiles.length).toEqual(5)
        expect(extractor.imageFiles.length).toEqual(31)

        let itemMetadata = extractor.createItemDataStructure()
        expect(itemMetadata.itemId).toEqual("98007")
        expect(itemMetadata.collectionId).toEqual("NT1")
        expect(itemMetadata.identifier).toEqual([
            "NT1-98007",
            "http://catalog.paradisec.org.au/collections/NT1/items/98007"
        ])
        expect(itemMetadata.collectionLink).toEqual(
            "http://catalog.paradisec.org.au/collections/NT1"
        )

        let collectionMetadata = extractor.createCollectionDataStructure()
        const collectionLanguages = extractor.getCollectionLanguages()
        expect(collectionLanguages).toEqual[("Bislama - bis", "Efate, South - erk", "Lelepa - lpa")]
        expect(collectionMetadata).toMatchObject({
            title: "South Efate (Vanuatu)",
            collectionId: "NT1",
            collectionLink: "http://catalog.paradisec.org.au/collections/NT1"
        })

        let { item, collection } = extractor.load()
        // console.log(item)
    })
    it("should be able to read and process NT5/TokelauOf", async () => {
        let extractor = new CatXmlExtractor({
            dataFolder: path.join(__dirname, "test-data/NT5/TokelauOf"),
            file: "NT5-TokelauOf-CAT-PDSC_ADMIN.xml"
        })

        await extractor.readCatalogFile()
        const classifications = extractor.getClassifications()
        const people = extractor.getPeople()
        const itemLanguages = extractor.getItemLanguages()
        const categories = extractor.getDataCategories()
        expect(classifications.length).toEqual(0)
        expect(people).toEqual([
            { role: "depositor", name: "Nick Thieberger" },
            { role: "recorder", name: "Nick Thieberger" },
            { role: "speaker", name: "Tokelau Takau" }
        ])
        expect(itemLanguages).toEqual([])
        expect(categories).toEqual(["music"])

        expect(extractor.videoFiles.length).toEqual(2)
        expect(extractor.audioFiles.length).toEqual(0)
        expect(extractor.documentFiles.length).toEqual(0)
        expect(extractor.transcriptionFiles.length).toEqual(1)
        expect(extractor.imageFiles.length).toEqual(0)

        let itemMetadata = extractor.createItemDataStructure()
        expect(itemMetadata.itemId).toEqual("TokelauOf")
        expect(itemMetadata.collectionId).toEqual("NT5")
        expect(itemMetadata.identifier).toEqual([
            "NT5-TokelauOf",
            "http://catalog.paradisec.org.au/collections/NT5/items/TokelauOf"
        ])
        expect(itemMetadata.collectionLink).toEqual(
            "http://catalog.paradisec.org.au/collections/NT5"
        )

        let collectionMetadata = extractor.createCollectionDataStructure()
        const collectionLanguages = extractor.getCollectionLanguages()
        expect(collectionLanguages).toEqual[("Bislama - bis", "Efate, South - erk", "Lelepa - lpa")]
        expect(collectionMetadata).toMatchObject({
            title: "South Efate, Vanuatu",
            collectionId: "NT5",
            collectionLink: "http://catalog.paradisec.org.au/collections/NT5"
        })

        let { item, collection } = extractor.load()
        // // console.log(item)
    })
})
