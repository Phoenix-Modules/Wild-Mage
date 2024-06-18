import copy from "rollup-plugin-copy";
import { defineConfig, Plugin } from "vite";

export default defineConfig({
    build: {
        sourcemap: true,
        rollupOptions: {
            input: {
                module: "src/module.js",
            },
            output: {
                entryFileNames: "scripts/[name].js",
                format: "es",
                dir: "dist",
            },
        },
    },
    plugins: [        
        copy({
            targets: [
                { src: "src/module.json", dest: "dist" },
                { src: "src/packs", dest: "dist" },
                { src: "src/styles", dest: "dist" },
                { src: "src/images", dest: "dist" },
            ],
            hook: "writeBundle",
        })
    ],
});

