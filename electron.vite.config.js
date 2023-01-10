import { resolve } from "path"
import { defineConfig, externalizeDepsPlugin } from "electron-vite"
import { viteStaticCopy } from "vite-plugin-static-copy"
import vue from "@vitejs/plugin-vue"

export default defineConfig({
    main: {
        build: {
            outDir: "dist/main"
        },
        plugins: [
            externalizeDepsPlugin(),
            viteStaticCopy({
                targets: [
                    {
                        src: "src/main/services/templates",
                        dest: ""
                    },
                    {
                        src: "src/main/services/viewer",
                        dest: ""
                    }
                ]
            })
        ]
    },
    preload: {
        build: {
            outDir: "dist/preload"
        },
        plugins: [externalizeDepsPlugin()]
    },
    renderer: {
        build: {
            outDir: "../../dist/renderer"
        },
        resolve: {
            alias: {
                "@renderer": resolve("src/renderer/src")
            }
        },
        plugins: [vue()]
    }
})
