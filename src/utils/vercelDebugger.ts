export function debugVercelAssets() {
    // Create a debug display element
    const debugContainer = document.createElement("div");
    debugContainer.style.position = "fixed";
    debugContainer.style.top = "10px";
    debugContainer.style.left = "10px";
    debugContainer.style.backgroundColor = "rgba(0,0,0,0.8)";
    debugContainer.style.color = "white";
    debugContainer.style.padding = "10px";
    debugContainer.style.borderRadius = "5px";
    debugContainer.style.maxWidth = "80vw";
    debugContainer.style.maxHeight = "80vh";
    debugContainer.style.overflow = "auto";
    debugContainer.style.zIndex = "10000";
    debugContainer.style.fontSize = "12px";
    debugContainer.style.fontFamily = "monospace";

    // Add a title
    const title = document.createElement("h3");
    title.textContent = "Asset Loading Debug";
    title.style.margin = "0 0 10px 0";
    debugContainer.appendChild(title);

    // Add content section
    const content = document.createElement("div");
    debugContainer.appendChild(content);

    // Add close button
    const closeButton = document.createElement("button");
    closeButton.textContent = "Close";
    closeButton.style.position = "absolute";
    closeButton.style.top = "5px";
    closeButton.style.right = "5px";
    closeButton.addEventListener("click", () => debugContainer.remove());
    debugContainer.appendChild(closeButton);

    // Function to add log entries
    const addLog = (message: string) => {
        const logEntry = document.createElement("div");
        logEntry.textContent = message;
        logEntry.style.marginBottom = "5px";
        content.appendChild(logEntry);
    };

    // Check if song_list.json exists
    addLog("Checking song_list.json...");
    fetch("/assets/songs/song_list.json")
        .then((response) => {
            if (response.ok) {
                addLog("✅ song_list.json found.");
                return response.json();
            } else {
                addLog(
                    `❌ song_list.json error: ${response.status} ${response.statusText}`,
                );
                throw new Error(`HTTP error: ${response.status}`);
            }
        })
        .then((data) => {
            addLog(`Found ${data.songs?.length || 0} songs in list.`);

            // Check each song file
            if (Array.isArray(data.songs)) {
                data.songs.forEach((song: any) => {
                    const songPath = `/assets/songs/${song.folder}/${song.file}`;
                    addLog(`Checking ${song.title} at ${songPath}...`);

                    fetch(songPath)
                        .then((response) => {
                            if (response.ok) {
                                addLog(`✅ ${song.title} file found.`);
                            } else {
                                addLog(
                                    `❌ ${song.title} error: ${response.status} ${response.statusText}`,
                                );
                            }
                        })
                        .catch((error) => {
                            addLog(
                                `❌ ${song.title} fetch error: ${error.message}`,
                            );
                        });
                });
            }
        })
        .catch((error) => {
            addLog(`❌ Error checking song list: ${error.message}`);
        });

    document.body.appendChild(debugContainer);
}
