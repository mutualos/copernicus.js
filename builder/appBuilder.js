let copernicusFunctions = [];
let copernicusAttributes = [];
let copernicusDictionaries = [];
let pipeItems = [];
let functionDescriptions = {};
let attributeDescriptions = {};
let dictionaryDescriptions = {};

// Function to extract items from a library object
function extractFromLibrary(libraryObject) {
    if (libraryObject.functions) {
        for (let key in libraryObject.functions) {
            // Check if the function is an implementation
            if (libraryObject.functions[key].implementation) {
                copernicusFunctions.push(key);
                functionDescriptions[key] = libraryObject.functions[key].description;
            }
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

// Function to extract items from pipes object
function extractFromPipes(pipesObject) {
    for (let category in pipesObject) {
        let categoryItems = [];
        for (let key in pipesObject[category]) {
            categoryItems.push(pipesObject[category][key]);
        }
        pipeItems.push({ category: category, items: categoryItems });
    }
}

// Function to load all libraries defined in editorConfig
function loadAllLibraries() {
    console.log('Loading the following libraries:');
    window.editorConfig.libraries.forEach(libraryName => {
        console.log(libraryName);
        if (window[libraryName]) {
            extractFromLibrary(window[libraryName]);
        }
    });

    if (window.translations) {
        extractFromPipes(window.translations.pipes);
    }

    updateSuggestionBox('attributes', copernicusAttributes, '');
    updateSuggestionBox('functions', copernicusFunctions, '');
    updateSuggestionBox('dictionaries', copernicusDictionaries, '');
    updatePipeSuggestionBox(pipeItems, '');
}

function highlightSyntax(text) {
    const colorMap = ['#1abc9c', '#3498db', '#9b59b6', '#e74c3c', '#f39c12']; // Colors for different levels of nested parentheses
    const errorColor = '#e74c3c'; // Red color for errors

    const stack = [];
    const parts = text.split(/([\(\)])/g);
    let highlighted = '';

    const allPipeItems = pipeItems.map(item => item.items).flat();

    parts.forEach(part => {
        if (part === '(') {
            const color = colorMap[stack.length % colorMap.length];
            stack.push(color);
            highlighted += `<span style="color: ${color};">${part}</span>`;
        } else if (part === ')') {
            if (stack.length > 0) {
                const color = stack.pop();
                highlighted += `<span style="color: ${color};">${part}</span>`;
            } else {
                highlighted += `<span style="color: ${errorColor};">${part}</span>`;
            }
        } else {
            highlighted += part
                .replace(/(\bfunction\b|\bvar\b|\blet\b|\bconst\b|\bif\b|\belse\b|\bfor\b|\bwhile\b)/g, '<span class="keyword">$1</span>')
                .replace(new RegExp(`\\b(${copernicusFunctions.join('|')})\\b`, 'g'), '<span class="function">$1</span>')
                .replace(new RegExp(`\\b(${copernicusAttributes.join('|')})\\b`, 'g'), '<span class="attribute">$1</span>')
                .replace(new RegExp(`\\b(${copernicusDictionaries.join('|')})\\b`, 'g'), '<span class="dictionaries">$1</span>')
                .replace(new RegExp(`\\b(${copernicusDictionaries.join('|')})\\s*:\\s*(\\d+|".*?")`, 'g'), '<span class="dictionaries">$1</span>:<span class="value">$2</span>')
                .replace(new RegExp(`\\b(${allPipeItems.join('|')})\\b`, 'g'), '<span class="pipe">$1</span>'); // Highlight pipe items
        }
    });

    // Highlight remaining unbalanced opening parentheses
    while (stack.length > 0) {
        const color = stack.pop();
        highlighted = highlighted.replace(new RegExp(`<span style="color: ${color};">\\(`), `<span style="color: ${errorColor};">(`);
    }

    return highlighted;
}

document.getElementById('editor').addEventListener('input', (e) => {
    const editor = e.target;
    const text = editor.innerText;
    const highlightedText = highlightSyntax(text);
    editor.innerHTML = highlightedText;
    placeCaretAtEnd(editor);
    updateSuggestions(text);
});

function placeCaretAtEnd(el) {
    el.focus();
    if (typeof window.getSelection !== "undefined" && typeof document.createRange !== "undefined") {
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }
}

function updateSuggestions(text) {
    const words = text.split(/\s+/);
    const lastWord = words[words.length - 1].toLowerCase(); // Convert to lowercase for case-insensitive match

    // Update suggestions for attributes, functions, dictionaries, and pipes
    updateSuggestionBox('attributes', copernicusAttributes, lastWord);
    updateSuggestionBox('functions', copernicusFunctions, lastWord);
    updateSuggestionBox('dictionaries', copernicusDictionaries, lastWord);
    updatePipeSuggestionBox(pipeItems, lastWord);
}

function updateSuggestionBox(id, suggestions, filter) {
    const container = document.getElementById(id);
    container.innerHTML = `<h3>${id.charAt(0).toUpperCase() + id.slice(1)}</h3>`;

    suggestions.filter(word => word.toLowerCase().includes(filter)).forEach(suggestion => {
        let description = '';
        if (id === 'functions') {
            description = functionDescriptions[suggestion] || '';
        } else if (id === 'attributes') {
            description = attributeDescriptions[suggestion] || '';
        } else if (id === 'dictionaries') {
            description = dictionaryDescriptions[suggestion] || '';
        }
        
        const item = document.createElement('div');
        item.className = `suggestion-item ${id}`;
        item.innerText = suggestion;
        item.setAttribute('title', description); // Add tooltip
        item.addEventListener('click', () => {
            insertSuggestion(document.getElementById('editor'), suggestion, id);
        });
        container.appendChild(item);
    });
}

function updatePipeSuggestionBox(pipeItems, filter) {
    const container = document.getElementById('pipes');
    container.innerHTML = `<h3>Pipes</h3>`;

    pipeItems.forEach(pipe => {
        const categoryContainer = document.createElement('div');
        categoryContainer.innerHTML = `<h4 class="pipe_category">${pipe.category}</h4>`;
        pipe.items.filter(word => word.toLowerCase().includes(filter)).forEach(suggestion => {
            const item = document.createElement('div');
            item.className = `suggestion-item pipe`;
            item.innerText = suggestion;
            item.addEventListener('click', () => {
                insertSuggestion(document.getElementById('editor'), suggestion, 'pipe');
            });
            categoryContainer.appendChild(item);
        });
        container.appendChild(categoryContainer);
    });
}

function insertSuggestion(editor, suggestion, type) {
    const text = editor.innerText;
    const words = text.split(/\s+/);

    let updatedSuggestion = suggestion;
    if (type === 'dictionaries') {
        updatedSuggestion = `${suggestion}: `;
    } else {
        updatedSuggestion = `${suggestion}`;
    }

    words[words.length - 1] = updatedSuggestion;
    const newText = words.join(' ');
    editor.innerText = newText;

    // Reapply syntax highlighting
    const highlightedText = highlightSyntax(newText);
    editor.innerHTML = highlightedText;
    placeCaretAtEnd(editor);
}

const loadScript = (src) => {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

const loadLibraryScripts = () => {
    return Promise.all(
        window.editorConfig.libraries.map(library => loadScript(`../library/${library}.js`))
    );
};


document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            if (content.id === tab.dataset.tab) {
                content.classList.add('active');
            }
        });
    });
});

document.getElementById('addColumnBtn').addEventListener('click', () => {
    const columnsContainer = document.getElementById('columnsContainer');
    const columnCard = document.createElement('div');
    columnCard.className = 'column-card';
    columnCard.innerHTML = `
        <button class="remove-btn" onclick="removeColumnCard(this)">X</button>
        <table>
            <tr>
                <th>
                    <div class="form-group">
                        <input type="text" name="header" class="form-control" required>
                    </div>
                </th>
            </tr>
            <tr>
                <td>
                    <div class="form-group">
                        <label for="key">Key:</label>
                        <input type="text" name="key" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="type">Type:</label>
                        <select name="type" class="form-control">
                            <option value="float">Float</option>
                            <option value="integer">Integer</option>
                            <option value="USD">USD</option>
                            <option value="currency">Currency</option>
                            <option value="percentage">Percentage</option>
                            <option value="upper">Upper</option>
                            <option value="category">Category</option>
                        </select>
                    </div>
                </td>
            </tr>
        </table>
    `;
    columnsContainer.prepend(columnCard);
    attachChangeListeners(columnCard);
    updateSelectOptions();
});

function removeColumnCard(button) {
    button.parentElement.remove();
    updateSelectOptions();
}

function updateSelectOptions() {
    const keys = [];
    const columnCards = document.querySelectorAll('.column-card');
    
    columnCards.forEach(card => {
        const key = card.querySelector('input[name="key"]').value;
        if (key) {
            keys.push(key);
        }
    });

    const primaryKeySelect = document.getElementById('primaryKey');
    const sortKeySelect = document.getElementById('sortKey');

    primaryKeySelect.innerHTML = '';
    sortKeySelect.innerHTML = '';

    keys.forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.text = key;
        primaryKeySelect.appendChild(option.cloneNode(true));
        sortKeySelect.appendChild(option);
    });
}

function attachChangeListeners(card) {
    const inputs = card.querySelectorAll('input[name="header"], input[name="key"], select[name="type"]');
    inputs.forEach(input => {
        input.addEventListener('input', updateSelectOptions);
        input.addEventListener('change', updateSelectOptions);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadLibraryScripts()
        .then(() => loadScript("../organization/translator.js"))
        .then(() => loadScript("saveApp.js"))
        .then(() => {
            // Call loadAllLibraries and log debug information
            loadAllLibraries();
            console.log('Pipe Items:', pipeItems); // Log pipe items for debugging
            console.log('Function Descriptions:', functionDescriptions); // Log function descriptions for debugging
            console.log('Attribute Descriptions:', attributeDescriptions); // Log attribute descriptions for debugging
            console.log('Dictionary Descriptions:', dictionaryDescriptions); // Log dictionary descriptions for debugging
        })
        .catch((error) => {
            console.error('Error loading scripts:', error);
        });
});

// Initially attach change listeners to existing column cards
document.querySelectorAll('.column-card').forEach(attachChangeListeners);