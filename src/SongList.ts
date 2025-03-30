import { Song } from "./Song";

export class SongList {
    songs: Song[] = [];

    async load(): Promise<void> {
        try {
            // Use a relative path for Vercel compatibility
            const songListPath = "/assets/songs/song_list.json";
            console.log("Attempting to load song list from:", songListPath);

            const response = await fetch(songListPath);
            if (!response.ok) {
                throw new Error(
                    `Failed to load song list: ${response.statusText} (${response.status})`,
                );
            }

            const data = await response.json();
            console.log("Raw song list data:", data);

            // Ensure the songs array is properly initialized
            if (!Array.isArray(data.songs)) {
                throw new Error(
                    "Song list data does not contain a songs array",
                );
            }

            // Convert raw data to Song objects
            this.songs = data.songs.map((songInfo: any) => {
                return new Song(
                    {
                        title: songInfo.title || "Unknown Title",
                        artist: songInfo.artist || "Unknown Artist",
                        url: songInfo.url || "",
                        difficulty: songInfo.difficulty || 1,
                    },
                    songInfo.folder || "",
                    songInfo.file || "",
                );
            });

            console.log("Loaded and processed song list:", this.songs);
        } catch (error) {
            console.error("Error loading song list:", error);
        }
    }
}
