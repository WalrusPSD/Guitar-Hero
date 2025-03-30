import "./style.css";
import { fromEvent, interval, merge, BehaviorSubject } from "rxjs";
import { map, scan, withLatestFrom, tap, filter } from "rxjs/operators";
import * as Tone from "tone";
import { SampleLibrary } from "./tonejs-instruments";

// Constants
const Viewport = {
    CANVAS_WIDTH: 200,
    CANVAS_HEIGHT: 400,
} as const;

const Constants = {
    TICK_RATE_MS: 12, // Game update interval in milliseconds
    NOTE_SPEED: 2, // Speed at which notes fall
    COLUMNS: 4, // Number of columns in the game
    HIT_ZONE_Y: 350, // Y-coordinate of the hit zone - adjusted to match the visual hitpad
    SONG_NAME: "IWonder", // Default song file (CSV) to load
    AVAILABLE_SONGS: [
        "amongUs",
        "IWonder",
        "RightMyWRongs",
        "RockinRobin",
        "Runaway",
        "TokyoGhoulOP2",
    ], // Updated list of available songs
} as const;

const columnColors = ["green", "red", "blue", "yellow"] as const;

const HIGH_SCORE_KEY = "guitarHeroHighScore";

// Types
type Action =
    | { type: "tick"; delta: number }
    | { type: "keydown"; key: Key }
    | { type: "keyup"; key: Key }
    | { type: "restart" }
    | { type: "changesong"; songName: string };

type Key = "KeyH" | "KeyJ" | "KeyK" | "KeyL";

type NoteObject = Readonly<{
    id: number;
    column: number;
    y: number;
    instrument: string;
    pitch: number;
    duration: number;
    startTime: number;
    velocity: number;
    userPlayed: boolean;
    scored?: boolean;
    isSustained: boolean;
    sustainProgress?: number;
}>;

type State = Readonly<{
    notes: ReadonlyArray<NoteObject>;
    score: number;
    multiplier: number;
    gameOver: boolean;
    time: number;
    consecutiveNotesHit: number;
    randomSeed: number;
    sustainedNotes: ReadonlyArray<NoteObject>;
}>;

type HighScore = Readonly<{
    score: number;
}>;

// Initial game state with default values
const initialState: State = {
    notes: [],
    score: 0,
    multiplier: 1,
    gameOver: false,
    time: 0,
    consecutiveNotesHit: 0,
    randomSeed: 42,
    sustainedNotes: [],
};

// Utility functions

/**
 * Generates a pseudo-random number based on a seed.
 * @param seed - The seed for the random number generator.
 * @returns An object containing the generated random value and the next seed.
 */
const pseudoRandom = (seed: number): { value: number; nextSeed: number } => {
    const m = 0x80000000; // 2^31
    const a = 1103515245; // Multiplier
    const c = 12345; // Increment
    const nextSeed = (a * seed + c) % m; // Calculate next seed
    const value = nextSeed / m; // Normalize to range [0, 1)
    return { value, nextSeed };
};

/**
 * Plays a random note using the provided samples.
 * @param samples - An object containing Tone.Sampler instances for different instruments.
 * @param randomSeed - The seed for the random number generator.
 * @returns The next random seed.
 */
const playRandomNote = (
    samples: { [key: string]: Tone.Sampler },
    randomSeed: number,
): number => {
    const instruments = Object.keys(samples); // Get list of instruments
    const { value: instrumentValue, nextSeed: nextSeed1 } =
        pseudoRandom(randomSeed); // Get random value and next seed for instrument
    const randomIndex = Math.floor(instrumentValue * instruments.length); // Select a random instrument
    const randomInstrument = samples[instruments[randomIndex]];

    const { value: pitchValue, nextSeed: nextSeed2 } = pseudoRandom(nextSeed1); // Get random value and next seed for pitch
    const { value: durationValue, nextSeed: nextSeed3 } =
        pseudoRandom(nextSeed2); // Get random value and next seed for duration

    const randomDuration = durationValue * 0.5; // Set a random duration

    // Generate a random MIDI pitch between C3 (48) and C5 (72)
    const randomPitch = 48 + Math.floor(pitchValue * 24); // Generates a MIDI note in the range C3 to C5
    const randomNote = Tone.Frequency(randomPitch, "midi").toNote(); // Convert MIDI note to a frequency note

    randomInstrument.triggerAttackRelease(randomNote, randomDuration); // Play the random note
    return nextSeed3; // Return the next seed for future use
};

/**
 * Parses a CSV string into an array of NoteObject.
 * @param csv - The CSV string containing note data.
 * @returns An array of NoteObject.
 */
const parseNotes = (csv: string): ReadonlyArray<NoteObject> => {
    const lines = csv.trim().split("\n"); // Split CSV into lines
    const headers = lines[0].split(",").map((header) => header.trim()); // Get CSV headers

    return lines.slice(1).map((line, index) => {
        const values = line.split(",").map((value) => value.trim()); // Split line into values
        const noteData: { [key: string]: string } = {};

        // Map values to headers
        headers.forEach((header, i) => {
            noteData[header] = values[i];
        });

        const userPlayed = noteData["user_played"].toLowerCase() === "true"; // Parse user_played flag
        const startTime = parseFloat(noteData["start (s)"]); // Parse start time
        const endTime = parseFloat(noteData["end (s)"]); // Parse end time
        const duration = endTime - startTime; // Calculate duration

        // Return a new NoteObject with parsed values
        return {
            id: index,
            column: parseInt(noteData["pitch"]) % Constants.COLUMNS, // Map pitch to a column
            y: 0,
            instrument: noteData["instrument_name"],
            pitch: parseInt(noteData["pitch"]),
            duration: duration,
            startTime: startTime,
            velocity: parseInt(noteData["velocity"]) / 127, // Normalize velocity
            userPlayed: userPlayed,
            isSustained: duration >= 1, // Determine if note is sustained
            sustainProgress: duration >= 1 ? 0 : undefined, // Initialize sustain progress
        };
    });
};

/**
 * Plays a note using the provided samples.
 * @param note - The NoteObject to be played.
 * @param samples - An object containing Tone.Sampler instances for different instruments.
 */
const playNote = (
    note: NoteObject,
    samples: { [key: string]: Tone.Sampler },
): void => {
    const sampler = samples[note.instrument]; // Get the sampler for the instrument
    if (sampler) {
        sampler.triggerAttackRelease(
            Tone.Frequency(note.pitch, "midi").toNote(), // Convert pitch to note
            note.duration, // Duration of the note
            undefined,
            note.velocity, // Set the velocity
        );
    }
};

/**
 * Calculates the x-coordinate for the center of a column.
 * @param column - The column number.
 * @returns The x-coordinate for the center of the column.
 */
const getColumnCenterX = (column: number): number => {
    // Center positions for each column (25, 75, 125, 175)
    switch (column) {
        case 0:
            return 25; // Green column center (0-50)
        case 1:
            return 75; // Red column center (50-100)
        case 2:
            return 125; // Blue column center (100-150)
        case 3:
            return 175; // Yellow column center (150-200)
        default:
            return 25;
    }
};

// Game logic functions

/**
 * Updates the positions of notes and removes notes that have passed the hit zone.
 * @param notes - The current array of notes.
 * @param elapsedTime - The time elapsed since the last update.
 * @returns An updated array of notes.
 */
const updateNotes = (
    notes: ReadonlyArray<NoteObject>,
    elapsedTime: number,
): ReadonlyArray<NoteObject> =>
    notes
        .map((note) => ({
            ...note,
            y: note.y + Constants.NOTE_SPEED, // Update y-position of each note
        }))
        .filter((note) => note.y < Constants.HIT_ZONE_Y); // Filter out notes that passed the hit zone

/**
 * Updates the progress of sustained notes.
 * @param sustainedNotes - The current array of sustained notes.
 * @param elapsedTime - The time elapsed since the last update.
 * @returns An updated array of sustained notes.
 */
const updateSustainedNotes = (
    sustainedNotes: ReadonlyArray<NoteObject>,
    elapsedTime: number,
): ReadonlyArray<NoteObject> => {
    return sustainedNotes
        .map((note) => ({
            ...note,
            sustainProgress: Math.min(
                (note.sustainProgress || 0) + elapsedTime / note.duration, // Update sustain progress
                1,
            ),
        }))
        .filter((note) => note.sustainProgress < 1); // Filter out fully sustained notes
};

/**
 * Updates the game state based on elapsed time and current notes.
 * @param state - The current game state.
 * @param elapsedTime - The time elapsed since the last update.
 * @param allNotes - All notes in the song.
 * @param samples - An object containing Tone.Sampler instances for different instruments.
 * @returns The updated game state.
 */
const updateState = (
    state: State,
    elapsedTime: number,
    allNotes: ReadonlyArray<NoteObject>,
    samples: { [key: string]: Tone.Sampler },
): State => {
    const currentTime = state.time + elapsedTime / 1000; // Update current time
    const newNotes = allNotes.filter(
        (note) => note.startTime >= state.time && note.startTime < currentTime, // Find notes to introduce
    );

    newNotes
        .filter((note) => !note.userPlayed) // Filter for non-user-played notes
        .forEach((note) => playNote(note, samples)); // Play these notes

    const updatedNotes = updateNotes(
        state.notes.concat(newNotes), // Add new notes to the state
        elapsedTime / 1000,
    );

    const updatedSustainedNotes = updateSustainedNotes(
        state.sustainedNotes,
        elapsedTime / 1000,
    );

    const missedNotes = state.notes.filter(
        (note) => note.y >= Constants.HIT_ZONE_Y && !note.scored, // Identify missed notes
    );

    const newConsecutiveNotesHit =
        missedNotes.length > 0 ? 0 : state.consecutiveNotesHit; // Reset cobo if a note is missed
    const newMultiplier = 1 + Math.floor(newConsecutiveNotesHit / 10) * 0.2; // Calculate new score multiplier

    const gameOver =
        currentTime >=
        Math.max(...allNotes.map((note) => note.startTime + note.duration)); // Check if game is over

    return {
        ...state,
        notes: updatedNotes,
        sustainedNotes: updatedSustainedNotes,
        consecutiveNotesHit: newConsecutiveNotesHit,
        multiplier: newMultiplier,
        time: currentTime,
        gameOver,
    };
};

/**
 * Handles a key press event in the game.
 * @param state - The current game state.
 * @param key - The key that was pressed.
 * @param samples - An object containing Tone.Sampler instances for different instruments.
 * @returns The updated game state.
 */
const handleKeyPress = (
    state: State,
    key: Key,
    samples: { [key: string]: Tone.Sampler },
): State => {
    const columnMap: { [key in Key]: number } = {
        KeyH: 0,
        KeyJ: 1,
        KeyK: 2,
        KeyL: 3,
    };
    const column = columnMap[key]; // Map key press to corresponding column

    const hitNote = state.notes.find(
        (note) =>
            note.column === column &&
            Math.abs(note.y - Constants.HIT_ZONE_Y) < 30 && // Check if note is within hit zone
            !note.scored &&
            note.userPlayed,
    );

    if (hitNote) {
        playNote(hitNote, samples); // Play the note if it was correctly hit
        const newScore = Math.round(state.score + 1 * state.multiplier); // Calculate new score
        const newConsecutiveNotesHit = state.consecutiveNotesHit + 1; // Increment combo
        const newMultiplier = 1 + Math.floor(newConsecutiveNotesHit / 10) * 0.2; // Update multiplier

        const updatedNotes = state.notes.filter((note) => note !== hitNote); // Remove hit note from state
        const newSustainedNotes = hitNote.isSustained
            ? [...state.sustainedNotes, { ...hitNote, sustainProgress: 0 }]
            : state.sustainedNotes;

        return {
            ...state,
            notes: updatedNotes,
            sustainedNotes: newSustainedNotes,
            score: newScore,
            consecutiveNotesHit: newConsecutiveNotesHit,
            multiplier: newMultiplier,
        };
    } else {
        const { nextSeed } = pseudoRandom(state.randomSeed); // Generate next seed
        playRandomNote(samples, nextSeed); // Play a random note if no hit
        return {
            ...state,
            randomSeed: nextSeed,
            consecutiveNotesHit: 0, // Reset combo
            multiplier: 1, // Reset multiplier
        };
    }
};

/**
 * Handles a key up event in the game.
 * @param state - The current game state.
 * @param key - The key that was released.
 * @returns The updated game state.
 */
const handleKeyUp = (state: State, key: Key): State => {
    const columnMap: { [key in Key]: number } = {
        KeyH: 0,
        KeyJ: 1,
        KeyK: 2,
        KeyL: 3,
    };
    const column = columnMap[key]; // Map key release to corresponding column

    // Reset the scored status of the note when the key is released
    const updatedNotes = state.notes.map((note) =>
        note.column === column ? { ...note, scored: false } : note,
    );

    return {
        ...state,
        notes: updatedNotes,
    };
};

/**
 * Changes the current song being played.
 * @param state - The current game state.
 * @param songName - The name of the new song.
 * @returns The updated game state.
 */
const changeSong = (state: State, songName: string): State => {
    const newNotes = parseNotes(songName); // Parse the new song notes
    return {
        ...state,
        notes: newNotes,
        score: 0,
        multiplier: 1,
        gameOver: false,
        time: 0,
        consecutiveNotesHit: 0,
        randomSeed: 42,
        sustainedNotes: [],
    };
};

// Rendering functions

/**
 * Renders the game state on the screen.
 * @param state - The current game state.
 * @param svg - The SVG element for the game.
 * @param scoreText - The element for displaying the score.
 * @param multiplierText - The element for displaying the score multiplier.
 * @param comboText - The element for displaying the combo count.
 */
const renderState = (
    state: State,
    svg: SVGSVGElement,
    scoreText: HTMLElement,
    multiplierText: HTMLElement,
    comboText: HTMLElement,
): void => {
    // Remove previous notes but leave the permanent hit zone indicators
    svg.querySelectorAll("circle.note, rect.sustain").forEach((elem) =>
        elem.remove(),
    );

    const sortedNotes = [...state.notes, ...state.sustainedNotes].sort(
        (a, b) => b.startTime - a.startTime,
    );

    sortedNotes.forEach((note) => {
        if (note.userPlayed) {
            const noteY = Math.min(note.y, Viewport.CANVAS_HEIGHT);
            const noteX = getColumnCenterX(note.column);
            const circleRadius = Viewport.CANVAS_WIDTH * 0.075;

            if (note.isSustained && note.sustainProgress !== undefined) {
                const tailHeight = 100;
                const remainingTailHeight =
                    tailHeight * (1 - note.sustainProgress);
                const sustainRect = document.createElementNS(
                    svg.namespaceURI,
                    "rect",
                );
                sustainRect.setAttribute("x", `${noteX - 7.5}`);
                sustainRect.setAttribute(
                    "y",
                    `${noteY - remainingTailHeight - circleRadius}`,
                );
                sustainRect.setAttribute("width", "15");
                sustainRect.setAttribute(
                    "height",
                    `${remainingTailHeight + circleRadius}`,
                );
                sustainRect.setAttribute("fill", columnColors[note.column]);
                sustainRect.setAttribute("opacity", "0.5");
                sustainRect.classList.add("sustain");
                svg.appendChild(sustainRect);
            }

            const noteElem = document.createElementNS(
                svg.namespaceURI,
                "circle",
            );
            noteElem.setAttribute("cx", `${noteX}`);
            noteElem.setAttribute("cy", `${noteY}`);
            noteElem.setAttribute("r", `${circleRadius}`);
            noteElem.setAttribute(
                "fill",
                `url(#${columnColors[note.column]}Gradient)`,
            );
            noteElem.setAttribute("stroke", "transparent");
            noteElem.setAttribute("stroke-width", "2");
            noteElem.classList.add("note");
            svg.appendChild(noteElem);
        }
    });

    scoreText.textContent = state.score.toString();
    multiplierText.textContent = state.multiplier.toFixed(1);
    const comboValue = document.getElementById("comboValue");
    if (comboValue) {
        comboValue.textContent = state.consecutiveNotesHit.toString();
    }

    // Make game over screen visible when game is over
    const gameOverElement = document.getElementById("gameOver");
    const restartButton = document.getElementById("restartButton");

    if (state.gameOver) {
        if (gameOverElement)
            gameOverElement.setAttribute("visibility", "visible");
        if (restartButton) restartButton.style.display = "block";
    } else {
        if (gameOverElement)
            gameOverElement.setAttribute("visibility", "hidden");
        if (restartButton) restartButton.style.display = "none";
    }
};

/**
 * Renders the high score on the screen.
 * @param highScore - The current high score object.
 */
const renderHighScore = (highScore: HighScore | null): void => {
    const highScoreElement = document.querySelector(
        "#highScoreText",
    ) as HTMLElement;
    if (highScore) {
        highScoreElement.textContent = highScore.score.toString();
    } else {
        highScoreElement.textContent = "0";
    }
};

/**
 * Retrieves the stored high score from local storage.
 * @returns The stored high score object or null if not found.
 */
const getStoredHighScore = (): HighScore | null => {
    const storedScore = localStorage.getItem(HIGH_SCORE_KEY);
    return storedScore ? JSON.parse(storedScore) : null;
};

/**
 * Saves a new high score to local storage.
 * @param score - The new high score to save.
 */
const saveHighScore = (score: number): void => {
    const newHighScore: HighScore = {
        score,
    };
    localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(newHighScore));
};

/**
 * Main game function that initializes and runs the game loop.
 * @param csvContents - The CSV string containing note data.
 * @param samples - An object containing Tone.Sampler instances for different instruments.
 */
function main(csvContents: string, samples: { [key: string]: Tone.Sampler }) {
    const svg = document.querySelector("#svgCanvas") as SVGSVGElement;
    const scoreText = document.querySelector("#scoreText") as HTMLElement;
    const multiplierText = document.querySelector(
        "#multiplierText",
    ) as HTMLElement;
    const comboText = document.querySelector("#comboText") as HTMLElement;

    // Set up key highlighting
    const keyButtons = {
        KeyH: document.getElementById("keyH") as HTMLButtonElement,
        KeyJ: document.getElementById("keyJ") as HTMLButtonElement,
        KeyK: document.getElementById("keyK") as HTMLButtonElement,
        KeyL: document.getElementById("keyL") as HTMLButtonElement,
    };

    // Song selection setup
    const songSelect = document.getElementById(
        "songSelect",
    ) as HTMLSelectElement;
    const changeSongButton = document.getElementById(
        "changeSongButton",
    ) as HTMLButtonElement;

    // Populate song selection dropdown
    Constants.AVAILABLE_SONGS.forEach((song) => {
        const option = document.createElement("option");
        option.value = song;
        option.textContent = song;
        songSelect.appendChild(option);
    });

    // Add event listener for song change button
    changeSongButton.addEventListener("click", async () => {
        const selectedSong = songSelect.value;
        try {
            // Change from "/assets/" to "./assets/" for relative path
            const response = await fetch(`./assets/${selectedSong}.csv`);
            const text = await response.text();
            // Create a custom event to restart with new song
            const changeSongEvent = new CustomEvent("changeSong", {
                detail: { song: selectedSong, csvData: text },
            });
            document.dispatchEvent(changeSongEvent);
        } catch (error) {
            console.error("Error fetching the CSV file:", error);
        }
    });

    let notes = parseNotes(csvContents); // Parse CSV to get notes

    // Add key down and up event listeners for highlighting
    document.addEventListener("keydown", (e) => {
        if (["KeyH", "KeyJ", "KeyK", "KeyL"].includes(e.code)) {
            const key = e.code as Key;
            keyButtons[key].classList.add("active");
        }
    });

    document.addEventListener("keyup", (e) => {
        if (["KeyH", "KeyJ", "KeyK", "KeyL"].includes(e.code)) {
            const key = e.code as Key;
            keyButtons[key].classList.remove("active");
        }
    });

    // Listen for song change events
    document.addEventListener("changeSong", ((e: CustomEvent) => {
        notes = parseNotes(e.detail.csvData); // Parse the new song notes
        restart$.next({ type: "restart" }); // Restart the game
        songChanged$.next({ type: "changesong", songName: e.detail.song }); // Change the song
    }) as EventListener);

    // Observable stream for key down events (H, J, K, L)
    const keyDown$ = fromEvent<KeyboardEvent>(document, "keydown").pipe(
        filter((e) => ["KeyH", "KeyJ", "KeyK", "KeyL"].includes(e.code)),
        map((e) => ({ type: "keydown" as const, key: e.code as Key })),
    );

    // Observable stream for key up events (H, J, K, L)
    const keyUp$ = fromEvent<KeyboardEvent>(document, "keyup").pipe(
        filter((e) => ["KeyH", "KeyJ", "KeyK", "KeyL"].includes(e.code)),
        map((e) => ({ type: "keyup" as const, key: e.code as Key })),
    );

    // Observable stream for restart events (R key)
    const restart$ = new BehaviorSubject<{ type: "restart" }>({
        type: "restart",
    });

    // Observable stream for song change events
    const songChanged$ = new BehaviorSubject<{
        type: "changesong";
        songName: string;
    }>({
        type: "changesong",
        songName: Constants.SONG_NAME,
    });

    // Observable stream for game ticks based on interval
    const tick$ = interval(Constants.TICK_RATE_MS).pipe(
        map(() => ({ type: "tick" as const, delta: Constants.TICK_RATE_MS })),
    );

    const highScore$ = new BehaviorSubject<HighScore | null>(
        getStoredHighScore(),
    ); // Initialize high score observable

    // Combine the streams and process the game logic
    const game$ = merge(tick$, keyDown$, keyUp$, restart$, songChanged$).pipe(
        scan((state: State, action: Action) => {
            switch (action.type) {
                case "tick":
                    return updateState(state, action.delta, notes, samples); // Update state on tick
                case "keydown":
                    return handleKeyPress(state, action.key, samples); // Handle key press
                case "keyup":
                    return handleKeyUp(state, action.key); // Handle key up
                case "restart":
                    return initialState; // Reset to initial state on restart
                case "changesong":
                    return { ...initialState, notes: [] }; // Reset state for song change
                default:
                    return state;
            }
        }, initialState),
        withLatestFrom(highScore$), // Combine state with high score
        tap(([state, highScore]) => {
            renderState(state, svg, scoreText, multiplierText, comboText); // Render game state
            renderHighScore(highScore); // Render high score

            // Update high score if needed
            if (
                state.gameOver &&
                (!highScore || state.score > highScore.score)
            ) {
                const newHighScore = {
                    score: state.score,
                };
                saveHighScore(state.score); // Save new high score
                highScore$.next(newHighScore); // Update high score observable
            }
        }),
    );

    game$.subscribe(); // Subscribe to the game stream and start the game
}

// Add event listener for "restart" event
document.addEventListener("restart", () => {
    // Get song select element
    const songSelect = document.getElementById(
        "songSelect",
    ) as HTMLSelectElement;

    // Create a custom event to restart the game
    const restartEvent = new CustomEvent("changeSong", {
        detail: {
            song: songSelect.value,
            csvData: document.querySelector("#csvData")?.textContent || "",
        },
    });
    document.dispatchEvent(restartEvent);
});

// Main event handler to restart the game using the R key
document.addEventListener("keydown", (e) => {
    if (e.code === "KeyR") {
        // Get the current selected song from the dropdown
        const songSelect = document.getElementById(
            "songSelect",
        ) as HTMLSelectElement;
        const currentSong = songSelect.value;

        // Fetch the current song data and restart
        fetch(`./assets/${currentSong}.csv`)
            .then((response) => response.text())
            .then((text) => {
                const changeSongEvent = new CustomEvent("changeSong", {
                    detail: {
                        song: currentSong,
                        csvData: text,
                    },
                });
                document.dispatchEvent(changeSongEvent);
            })
            .catch((error) =>
                console.error(
                    "Error fetching the CSV file for restart:",
                    error,
                ),
            );
    }
});

// The following simply runs your main function on window load.  Make sure to leave it in place.
// You should not need to change this, beware if you are.
if (typeof window !== "undefined") {
    window.onload = () => {
        const samples = SampleLibrary.load({
            instruments: [
                "bass-electric",
                "violin",
                "piano",
                "trumpet",
                "saxophone",
                "trombone",
                "flute",
            ],
            baseUrl: "samples/",
        });

        Tone.ToneAudioBuffer.loaded().then(() => {
            for (const instrument in samples) {
                samples[instrument].toDestination();
                samples[instrument].release = 0.5;
            }

            // Use relative path for assets to ensure they work in both local and production
            fetch(`./assets/${Constants.SONG_NAME}.csv`)
                .then((response) => response.text())
                .then((text) => {
                    // Initialize the game on first click (needed for audio context)
                    const startGame = () => {
                        main(text, samples);
                    };

                    console.log(
                        "Game ready to start - click anywhere to begin!",
                    );
                    document.body.addEventListener("click", startGame, {
                        once: true,
                    });

                    // Also allow spacebar to start game
                    document.body.addEventListener(
                        "keydown",
                        (e) => {
                            if (e.code === "Space") {
                                startGame();
                                document.body.removeEventListener(
                                    "click",
                                    startGame,
                                );
                            }
                        },
                        { once: true },
                    );
                })
                .catch((error) =>
                    console.error("Error fetching the CSV file:", error),
                );
        });
    };
}
