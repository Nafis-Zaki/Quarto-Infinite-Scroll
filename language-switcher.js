document.addEventListener("DOMContentLoaded", function () {
    updateLanguageLinks();

    // Listen for article changes from infinite scroll
    document.addEventListener('articleChanged', function (e) {
        const newBaseName = e.detail.baseName;
        // Update links based on the new visible article
        updateLanguageLinks(newBaseName);
    });
});

let searchIndex = null;

async function getSearchIndex() {
    if (searchIndex) return searchIndex;
    try {
        const response = await fetch('search.json');
        if (!response.ok) return [];
        searchIndex = await response.json();
        return searchIndex;
    } catch (e) {
        console.error("Failed to load search index", e);
        return [];
    }
}

async function updateLanguageLinks(manualBaseName = null) {
    let baseName;
    let lang = "en";

    if (manualBaseName) {
        baseName = manualBaseName;
        const currentPath = window.location.pathname;
        const filename = currentPath.split("/").pop();

        if (filename.endsWith("_bn.html")) lang = "bn";
        else if (filename.endsWith("_ur.html")) lang = "ur";

    } else {
        const currentPath = window.location.pathname;
        let filename = currentPath.split("/").pop();

        if (filename === "" || filename === "/") {
            filename = "index.html";
        }

        baseName = filename.replace(".html", "");

        if (baseName.endsWith("_bn")) {
            lang = "bn";
            baseName = baseName.replace("_bn", "");
        } else if (baseName.endsWith("_ur")) {
            lang = "ur";
            baseName = baseName.replace("_ur", "");
        }
    }

    // Select language links
    const links = document.querySelectorAll('.navbar-nav .dropdown-menu .dropdown-item');

    // Find the parent dropdown to hide if needed
    let languageMenu = null;
    if (links.length > 0) {
        languageMenu = links[0].closest('.nav-item.dropdown');
    }

    // Hide everything initially
    if (languageMenu) {
        languageMenu.style.display = 'none';
    }
    links.forEach(link => {
        link.style.display = 'none';
    });

    // Load search index to check availability
    const index = await getSearchIndex();

    // Helper to check if file exists in index
    // Quarto search index usually has 'objectID' as the URL or 'href'
    // Structure: [{ "objectID": "index.html", ... }, ...]
    const fileExists = (filename) => {
        // If index is empty or failed to load (e.g., CORS on file:/// protocol),
        // fallback to assuming translations exist so language switcher appears
        // This allows the switcher to work even when search.json can't be fetched
        if (!index || index.length === 0) return true;

        return index.some(item => item.objectID === filename || item.href === filename || item.objectID.endsWith(filename));
    };

    let availableCount = 0;

    links.forEach(link => {
        const text = link.textContent.trim();
        let targetSuffix = "";
        let isCurrent = false;

        if (text.includes("English")) {
            targetSuffix = "";
            if (lang === "en") isCurrent = true;
        } else if (text.includes("Bengali") || text.includes("বাংলা")) {
            targetSuffix = "_bn";
            if (lang === "bn") isCurrent = true;
        } else if (text.includes("Urdu") || text.includes("اردو")) {
            targetSuffix = "_ur";
            if (lang === "ur") isCurrent = true;
        } else {
            return;
        }

        const targetFilename = baseName + targetSuffix + ".html";
        link.setAttribute('href', targetFilename);

        if (isCurrent) {
            link.style.display = 'block';
            availableCount++;
        } else {
            // Check existence using search index
            if (fileExists(targetFilename)) {
                link.style.display = 'block';
                availableCount++;
            }
        }
    });

    if (languageMenu && availableCount > 1) {
        languageMenu.style.display = '';
    }
}
