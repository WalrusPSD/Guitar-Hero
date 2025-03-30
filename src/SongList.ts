import { Song } from "./Song";
import { songDataBank } from "./songDataBank";

export class SongList {
    songs: Song[] = [];

    async load(): Promise<void> {
        try {
            console.log("Loading songs...");

            // Create Song objects for the songs in our data bank
            this.songs = [
                new Song(
                    {
                        title: "I Wonder",
                        artist: "Kanye West",
                        url: "",
                        difficulty: 2,
                    },
                    "", // Folder is not needed with songs in data bank
                    "IWonder.csv", // We'll keep the filename for consistency
                ),
                new Song(
                    {
                        title: "Among Us Theme",
                        artist: "Game OST",
                        url: "",
                        difficulty: 1,
                    },
                    "", // Folder is not needed with songs in data bank
                    "amongUs.csv", // We'll keep the filename for consistency
                ),
            ];

            console.log("Loaded song list:", this.songs);
        } catch (error) {
            console.error("Error loading song list:", error);
        }
    }
}
