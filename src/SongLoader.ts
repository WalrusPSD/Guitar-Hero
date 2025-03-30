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
    }
}
