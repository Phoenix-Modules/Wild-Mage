import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import copy from "rollup-plugin-copy";
import { defineConfig } from "vite";

export default defineConfig({
    build: {
        minify: true,
        rollupOptions: {
            treeshake: false,
            plugins: [nodeResolve({ exportConditions: ['node'] }), commonjs()],
            input: {
                module: "src/module.js",
            },
            output: {
                entryFileNames: "scripts/pm-wildmage.js",
                format: "es",
                dir: "dist",
            },
        },
    },
    plugins: [        
        copy({
            targets: [
                { src: "src/module.json", dest: "dist" },
                { src: "src/templates", dest: "dist" },
                { src: "src/packs", dest: "dist" },
                { src: "src/styles", dest: "dist" },
                { src: "src/assets", dest: "dist" },
            ],
            hook: "writeBundle",
        })
    ],
});

