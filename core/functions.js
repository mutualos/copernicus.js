function loadLibrary(libraryName) {
    var script = document.createElement('script');
    script.src = `library/${libraryName}.js`;
    script.onload = function() {
        console.log(`${libraryName} library loaded successfully.`);
        document.dispatchEvent(new CustomEvent('libraryLoaded', { detail: libraryName }));
    };
    script.onerror = function() {
        console.error(`Failed to load library: ${libraryName}`);
    };
    document.head.appendChild(script);
}
