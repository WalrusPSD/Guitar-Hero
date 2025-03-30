import { Song, SongData } from "./Song";
import { SongList } from "./SongList";
import { hardcodedSongs } from "./hardcodedSongs";

export class SongLoader {
    async load(songList: SongList): Promise<SongData[]> {
        const songs: SongData[] = [];
        console.log(
            "Starting to load hardcoded songs, song list has:",
            songList.songs.length,
            "songs",
        );

        for (const songInfo of songList.songs) {
            try {
                // Get the song data from hardcoded songs based on filename
                const songKey = songInfo.file.replace(
                    ".csv",
                    "",
                ) as keyof typeof hardcodedSongs;
                const csvText = hardcodedSongs[songKey];

                if (!csvText) {
                    throw new Error(
                        `Hardcoded song data not found for: ${songKey}`,
                    );
                }

                console.log(
                    `Successfully loaded hardcoded data for ${songInfo.name}, length: ${csvText.length}`,
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
