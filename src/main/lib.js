import { dialog } from "electron"
import { app } from "electron"
import DataLoader from "./services/data-service.js"
import path from "path"

export async function selectFolder() {
    console.log("F:selectFolder")

    const { filePaths } = await dialog.showOpenDialog({ properties: ["openDirectory"] })
    if (!filePaths.length) return

    const filePath = filePaths[0]
    return filePath
}

export async function loadData(event, params) {
    const applicationPath = path.join(app.getAppPath(), "dist", "main")

    const dataloader = new DataLoader({
        targetDevice: params.targetDevice,
        localDataPath: params.localDataPath,
        usbMountPoint: params.usbMountPoint,
        applicationPath
    })
    dataloader.on("progress", (msg) => {
        event.sender.send("progress", msg)
    })
    dataloader.on("info", (msg) => {
        event.sender.send("message", { text: msg, level: "info" })
    })
    dataloader.on("error", (msg) => {
        event.sender.send("message", { text: msg, level: "error" })
    })
    dataloader.on("complete", (msg) => {
        event.sender.send("message", { text: msg, level: "complete" })
    })
    await dataloader.load()
    // await dataloader.prepareTarget()
    // await dataloader.installCollectionViewer()
    // const { folders, errors } = await dataloader.walk()
    // let { items, collections } = await dataloader.buildIndex({ folders })
    // const index = await dataloader.installTheData({
    //     collections,
    //     items
    // })
}
