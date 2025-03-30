import { Song, SongData } from "./Song";
import { SongList } from "./SongList";

export class SongLoader {
    async load(songList: SongList): Promise<SongData[]> {
        const songs: SongData[] = [];
        console.log(
            "Starting to load songs, song list has:",
            songList.songs.length,
            "songs",
        );

        for (const songInfo of songList.songs) {
            try {
                // Use absolute path from root for Vercel compatibility
                const csvPath = `/assets/songs/${songInfo.folder}/${songInfo.file}`;
                console.log(`Attempting to load song from: ${csvPath}`);

                const response = await fetch(csvPath);
                if (!response.ok) {
                    throw new Error(
                        `Failed to load song: ${response.statusText} (${response.status})`,
                    );
                }

                const csvText = await response.text();
                console.log(
                    `Successfully loaded CSV text for ${songInfo.name}, length: ${csvText.length}`,
                );

                const songData = this.parseCSV(csvText);
                songs.push(songData);
                console.log(
                    `Successfully parsed song data for: ${songData.title}`,
                );
            } catch (error) {
                console.error(`Error loading song ${songInfo.name}:`, error);
            }
        }

        console.log(
            `Successfully loaded ${songs.length} songs out of ${songList.songs.length} attempted`,
        );
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
