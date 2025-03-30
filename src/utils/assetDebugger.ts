// This file helps troubleshoot asset loading issues in production

export async function debugFetch(
    url: string | URL | Request,
    init?: RequestInit,
): Promise<Response> {
    console.log(
        `🌐 Fetching: ${url instanceof URL ? url.toString() : url instanceof Request ? url.url || "(Request object)" : url}`,
    );

    return fetch(url, init)
        .then((response) => {
            if (
                !response.ok &&
                typeof url === "string" &&
                url.includes("/assets/")
            ) {
                console.error(
                    `Failed to load asset: ${url}`,
                    response.status,
                    response.statusText,
                );
            }
            return response;
        })
        .catch((error) => {
            console.error(`Error fetching ${url}:`, error);
            throw error;
        });
}

// Add a global error handler to catch and log all errors
export function handleError(message: string, error: unknown): void {
    console.error(
        `❌ ${message}:`,
        error instanceof Error ? error.message : String(error),
    );
    // Create a visible error message on the page for easier debugging
    const errorDiv = document.createElement("div");
    errorDiv.style.position = "fixed";
    errorDiv.style.bottom = "10px";
    errorDiv.style.left = "10px";
    errorDiv.style.backgroundColor = "rgba(255,0,0,0.8)";
    errorDiv.style.color = "white";
    errorDiv.style.padding = "10px";
    errorDiv.style.borderRadius = "5px";
    errorDiv.style.zIndex = "9999";
    errorDiv.textContent = `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
    document.body.appendChild(errorDiv);

    // Auto-remove after 10 seconds
    setTimeout(() => errorDiv.remove(), 10000);
}

// Add a debug button to check asset paths
export function setupAssetDebugger() {
    const debugButton = document.createElement("button");
    debugButton.textContent = "Debug Assets";
    debugButton.style.position = "fixed";
    debugButton.style.top = "10px";
    debugButton.style.right = "10px";
    debugButton.style.zIndex = "1000";

    debugButton.addEventListener("click", async () => {
        try {
            // Check if assets directory exists
            const response = await fetch("/assets/songs/song_list.json");
            console.log(
                "Song list fetch response:",
                response.status,
                response.statusText,
            );

            if (response.ok) {
                const data = await response.json();
                console.log("Song list content:", data);

                // Display success message
                alert(
                    `Successfully loaded song list with ${data.songs?.length || 0} songs`,
                );
            } else {
                alert(
                    `Failed to load song list: ${response.status} ${response.statusText}`,
                );
            }
        } catch (error) {
            console.error("Debug check failed:", error);
            alert(
                `Error checking assets: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    });

    document.body.appendChild(debugButton);
}
