export interface SongData {
    title: string;
    artist: string;
    url: string;
    difficulty: number;
    // Add any other properties that might be needed
}

export class Song {
    private data: SongData;
    public folder: string;
    public file: string;
    public name: string;

    constructor(data: SongData, folder: string, file: string) {
        this.data = data;
        this.folder = folder;
        this.file = file;
        this.name = data.title || "Unknown Song";
    }

    get title(): string {
        return this.data.title;
    }

    get artist(): string {
        return this.data.artist;
    }

    get url(): string {
        return this.data.url;
    }

    get difficulty(): number {
        return this.data.difficulty;
    }
}
