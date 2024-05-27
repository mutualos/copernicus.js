let copernicusFunctions = [];
let copernicusAttributes = [];
let copernicusDictionaries = [];
let pipeItems = [];

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

function extractFromPipes(pipesObject) {
    console.log('Extracting pipes:', pipesObject); // Debug statement
    for (let category in pipesObject) {
        console.log('Category:', category); // Debug statement
        let categoryItems = [];
        for (let key in pipesObject[category]) {
            console.log('Value:', pipesObject[category][key]); // Debug statement
            categoryItems.push(pipesObject[category][key]);
        }
        pipeItems.push({ category: category, items: categoryItems });
    }
}

function loadAllLibraries() {
    if (window.organization) extractFromLibrary(organization);
    if (window.api) extractFromLibrary(api);
    if (window.financial) extractFromLibrary(financial);

    if (window.translations) {
        console.log('Translations found:', window.translations); // Debug statement
        extractFromPipes(window.translations);
    } else {
        console.log('Translations not found'); // Debug statement
    }

    updateSuggestionBox('attributes', copernicusAttributes, '');
    updateSuggestionBox('functions', copernicusFunctions, '');
    updateSuggestionBox('dictionaries', copernicusDictionaries, '');
    updatePipeSuggestionBox(pipeItems, '');
}

document.addEventListener('DOMContentLoaded', () => {
    loadAllLibraries();
    console.log('Pipe Items:', pipeItems); // Log pipe items for debugging
});
