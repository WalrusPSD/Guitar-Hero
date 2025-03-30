import pluginChecker from "vite-plugin-checker";
import { UserConfig } from "vite";

const config: UserConfig = {
    plugins: [pluginChecker({ typescript: true, overlay: false })],
    // Add publicDir configuration to ensure assets are copied to the build output
    publicDir: "assets",
    // Ensure base path is set to handle relative paths correctly
    base: "./",
    build: {
        // Explicitly tell Vite to copy the assets folder to the output directory
        assetsDir: "assets",
        rollupOptions: {
            // Ensure .csv files are recognized as assets
            output: {
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name.endsWith(".csv")) {
                        return "assets/[name][extname]";
                    }
                    return "assets/[name]-[hash][extname]";
                },
            },
        },
    },
};

const getConfig = () => config;

export default getConfig;
