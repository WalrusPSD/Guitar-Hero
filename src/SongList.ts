import { Song } from "./Song";

export class SongList {
    songs: Song[] = [];

    async load(): Promise<void> {
        try {
            // Update the path to use URL-based resolution
            const songListPath = new URL(
                "../assets/songs/song_list.json",
                import.meta.url,
            ).href;

            const response = await fetch(songListPath);
            if (!response.ok) {
                throw new Error(
                    `Failed to load song list: ${response.statusText}`,
                );
            }

            const data = await response.json();
            this.songs = data.songs;

            // Add debug logging
            console.log("Loaded song list:", this.songs);
        } catch (error) {
            console.error("Error loading song list:", error);
        }
    }
}
