import pluginChecker from "vite-plugin-checker";
import { UserConfig, defineConfig } from "vite";
import { resolve } from "path";

const config: UserConfig = defineConfig({
    plugins: [pluginChecker({ typescript: true, overlay: false })],
    // Set the correct base path for deployment
    base: "",
    // Make sure assets are properly included
    build: {
        outDir: "dist",
        assetsInlineLimit: 0,
        rollupOptions: {
            input: {
                main: resolve(__dirname, "index.html"),
            },
        },
    },
    // Ensure the correct asset handling
    server: {
        fs: {
            // Allow serving files from one level up to the project root
            allow: [".."],
        },
    },
});

export default config;
