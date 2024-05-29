let copernicusFunctions = [];
let copernicusAttributes = [];
let copernicusDictionaries = [];
let pipeItems = [];
let functionDescriptions = {};
let attributeDescriptions = {};
let dictionaryDescriptions = {};

function extractFromLibrary(libraryObject) {
    if (libraryObject.functions) {
        for (let key in libraryObject.functions) {
            copernicusFunctions.push(key);
            functionDescriptions[key] = libraryObject.functions[key].description;
        }
    }
    if (libraryObject.attributes) {
        for (let key in libraryObject.attributes) {
            copernicusAttributes.push(key);
            attributeDescriptions[key] = libraryObject.attributes[key].description;
        }
    }
    if (libraryObject.dictionaries) {
        for (let key in libraryObject.dictionaries) {
            copernicusDictionaries.push(key);
            dictionaryDescriptions[key] = libraryObject.dictionaries[key].description;
        }
    }
}

function extractFromPipes(pipesObject) {
    for (let category in pipesObject) {
        let categoryItems = [];
        for (let key in pipesObject[category]) {
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
        extractFromPipes(window.translations);
    }

    updateSuggestionBox('attributes', copernicusAttributes, '');
    updateSuggestionBox('functions', copernicusFunctions, '');
    updateSuggestionBox('dictionaries', copernicusDictionaries, '');
    updatePipeSuggestionBox(pipeItems, '');
}

document.addEventListener('DOMContentLoaded', () => {
    loadAllLibraries();
    console.log('Pipe Items:', pipeItems); // Log pipe items for debugging
    console.log('Function Descriptions:', functionDescriptions); // Log function descriptions for debugging
    console.log('Attribute Descriptions:', attributeDescriptions); // Log attribute descriptions for debugging
    console.log('Dictionary Descriptions:', dictionaryDescriptions); // Log dictionary descriptions for debugging
});
