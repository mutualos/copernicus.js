document.addEventListener('DOMContentLoaded', function() {
    if (window.buildConfig && window.buildConfig.libraries) {
        loadLibraries(window.buildConfig.libraries, (loadedLibraries) => {
            const conflicts = detectConflicts(window.financial);
            if (conflicts.length > 0) {
                displayConflicts(conflicts);
            } else {
                document.dispatchEvent(new CustomEvent('allLibrariesLoaded', { detail: loadedLibraries }));
            }
        });
    } else {
        console.error('buildConfig or libraries not defined');
    }
});

function loadLibrary(libraryName, callback) {
    var script = document.createElement('script');
    script.src = `library/${libraryName}.js`;
    script.onload = function() {
        console.log(`${libraryName} library loaded successfully.`);
        callback(null, libraryName);
    };
    script.onerror = function() {
        console.error(`Failed to load library: ${libraryName}`);
        callback(new Error(`Failed to load library: ${libraryName}`));
    };
    document.head.appendChild(script);
}

function loadLibraries(libraries, finalCallback) {
    let loadedCount = 0;
    const totalLibraries = libraries.length;
    const loadedLibraries = [];

    libraries.forEach(libraryName => {
        loadLibrary(libraryName, (error, name) => {
            if (!error) {
                loadedLibraries.push(name);
                loadedCount++;
                if (loadedCount === totalLibraries) {
                    finalCallback(loadedLibraries);
                }
            } else {
                console.error(error);
            }
        });
    });
}

function detectConflicts(financial) {
    const conflicts = [];
    const keys = Object.keys(financial);
    keys.forEach(key => {
        if (typeof financial[key] === 'function' || typeof financial[key] === 'object') {
            if (keys.filter(k => k === key).length > 1) {
                conflicts.push(key);
            }
        }
    });
    return conflicts;
}

function displayConflicts(conflicts) {
    const conflictMessage = `Conflicts detected in the following identifiers: ${conflicts.join(', ')}. Please resolve these conflicts in the libraries.`;
    alert(conflictMessage);
}
