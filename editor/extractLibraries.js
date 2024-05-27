let copernicusFunctions = [];
let copernicusAttributes = [];
let copernicusDictionaries = [];

function extractFromLibrary(libraryObject) {
    for (let key in libraryObject) {
        if (typeof libraryObject[key] === 'function') {
            copernicusFunctions.push(key);
        } else if (typeof libraryObject[key] === 'object' && !Array.isArray(libraryObject[key])) {
            copernicusDictionaries.push(key);
        } else {
            copernicusAttributes.push(key);
        }
    }
}

function loadAllLibraries() {
    if (window.organization) extractFromLibrary(organization);
    if (window.api) extractFromLibrary(api);
    if (window.financial) extractFromLibrary(financial);

    updateSuggestionBox('attributes', copernicusAttributes, '');
    updateSuggestionBox('functions', copernicusFunctions, '');
    updateSuggestionBox('dictionaries', copernicusDictionaries, '');
}

document.addEventListener('DOMContentLoaded', () => {
    loadAllLibraries();
});
