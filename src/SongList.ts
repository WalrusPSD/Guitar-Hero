import { Song } from "./Song";
import { hardcodedSongs } from "./hardcodedSongs";

export class SongList {
    songs: Song[] = [];

    async load(): Promise<void> {
        try {
            console.log("Loading hardcoded songs...");

            // Create Song objects for the hardcoded songs
            this.songs = [
                new Song(
                    {
                        title: "I Wonder",
                        artist: "Kanye West",
                        url: "",
                        difficulty: 2,
                    },
                    "", // Folder is not needed with hardcoded songs
                    "IWonder.csv", // We'll keep the filename for consistency
                ),
                new Song(
                    {
                        title: "Among Us Theme",
                        artist: "Game OST",
                        url: "",
                        difficulty: 1,
                    },
                    "", // Folder is not needed with hardcoded songs
                    "amongUs.csv", // We'll keep the filename for consistency
                ),
            ];

            console.log("Loaded hardcoded song list:", this.songs);
        } catch (error) {
            console.error("Error loading hardcoded song list:", error);
        }
    }
}
