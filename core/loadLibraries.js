function loadLibrary(library, callback) {
    var script = document.createElement('script');
    var libraryUrl;

    // Check if the library is a URL
    if (typeof library === 'string' && (library.startsWith('http://') || library.startsWith('https://'))) {
        libraryUrl = library;
    } else {
        libraryUrl = `library/${library}.js`;
    }

    script.src = libraryUrl;

    script.onload = function() {
        console.log(`Library loaded successfully from ${libraryUrl}`);
        // Combine the loaded library into the libraries object
        Object.keys(window).forEach(key => {
            if (!['libraries', 'buildConfig'].includes(key) && typeof window[key] === 'object' && !window.libraries[key]) {
                Object.assign(window.libraries, window[key]);
                delete window[key];
            }
        });
        callback(null);
    };

    script.onerror = function() {
        console.error(`Failed to load library from ${script.src}`);
        callback(new Error(`Failed to load library from ${script.src}`));
    };

    document.head.appendChild(script);
}

function loadLibraries(libraries, finalCallback) {
    let loadedCount = 0;
    const totalLibraries = libraries.length;

    // Initialize the combined libraries object
    window.libraries = {};

    libraries.forEach(library => {
        loadLibrary(library, (error) => {
            if (!error) {
                loadedCount++;
                if (loadedCount === totalLibraries) {
                    finalCallback(window.libraries);
                }
            } else {
                console.error(error);
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    if (window.buildConfig && window.buildConfig.libraries) {
        loadLibraries(window.buildConfig.libraries, (combinedLibraries) => {
            const conflicts = detectConflicts(combinedLibraries);
            if (conflicts.length > 0) {
                displayConflicts(conflicts);
            } else {
                document.dispatchEvent(new CustomEvent('allLibrariesLoaded', { detail: combinedLibraries }));
            }
        });
    } else {
        console.error('buildConfig or libraries not defined');
    }
});

function detectConflicts(libraries) {
    const conflicts = [];
    const keys = Object.keys(libraries);
    const seenKeys = new Set();

    keys.forEach(key => {
        if (typeof libraries[key] === 'function' || typeof libraries[key] === 'object') {
            if (seenKeys.has(key)) {
                conflicts.push(key);
            }
            seenKeys.add(key);
        }
    });

    return conflicts;
}

function displayConflicts(conflicts) {
    const conflictMessage = `Conflicts detected in the following identifiers: ${conflicts.join(', ')}. Please resolve these conflicts in the libraries.`;
    alert(conflictMessage);
}
