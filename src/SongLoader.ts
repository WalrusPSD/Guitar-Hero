import { Song, SongData } from "./Song";
import { SongList } from "./SongList";

export class SongLoader {
    async load(songList: SongList): Promise<SongData[]> {
        const songs: SongData[] = [];

        for (const songInfo of songList.songs) {
            try {
                // Update path resolution to ensure it works in production
                const csvPath = new URL(
                    `../assets/songs/${songInfo.folder}/${songInfo.file}`,
                    import.meta.url,
                ).href;

                const response = await fetch(csvPath);
                if (!response.ok) {
                    throw new Error(
                        `Failed to load song: ${response.statusText}`,
                    );
                }

                const csvText = await response.text();
                const songData = this.parseCSV(csvText);
                songs.push(songData);
            } catch (error) {
                console.error(`Error loading song ${songInfo.name}:`, error);
            }
        }

        return songs;
    }

    parseCSV(csvText: string): SongData {
        // Implementation of CSV parsing logic
        // This is a placeholder implementation - adjust according to your CSV format
        const lines = csvText.trim().split("\n");
        const header = lines[0].split(",");
        const data = lines[1].split(",");

        return {
            title: data[0] || "Unknown Title",
            artist: data[1] || "Unknown Artist",
            url: data[2] || "",
            difficulty: parseInt(data[3]) || 1,
        };
    }
}
