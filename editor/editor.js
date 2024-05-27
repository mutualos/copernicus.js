function highlightSyntax(text) {
    const colorMap = ['#1abc9c', '#3498db', '#9b59b6', '#e74c3c', '#f39c12']; // Colors for different levels of nested parentheses
    const errorColor = '#e74c3c'; // Red color for errors

    const stack = [];
    const parts = text.split(/([\(\)])/g);
    let highlighted = '';

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
                .replace(new RegExp(`\\b(${copernicusDictionaries.join('|')})\\s*:\\s*(\\d+|".*?")`, 'g'), '<span class="dictionary">$1</span>:<span class="value">$2</span>');
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
    const lastWord = words[words.length - 1];
    
    updateSuggestionBox('attributes', copernicusAttributes, lastWord);
    updateSuggestionBox('functions', copernicusFunctions, lastWord);
    updateSuggestionBox('dictionaries', copernicusDictionaries, lastWord);
}

function updateSuggestionBox(id, suggestions, filter) {
    const container = document.getElementById(id);
    container.innerHTML = `<h3>${id.charAt(0).toUpperCase() + id.slice(1)}</h3>`;
    
    suggestions.filter(word => word.startsWith(filter)).forEach(suggestion => {
        const item = document.createElement('div');
        item.className = `suggestion-item ${id}`;
        item.innerText = suggestion;
        item.addEventListener('click', () => {
            insertSuggestion(document.getElementById('editor'), suggestion, id);
        });
        container.appendChild(item);
    });
}

function insertSuggestion(editor, suggestion, type) {
    const text = editor.innerText;
    const words = text.split(/\s+/);
    
    let updatedSuggestion = suggestion;
    if (type === 'dictionaries') {
        updatedSuggestion = `${suggestion}: `;
    }
    
    words[words.length - 1] = updatedSuggestion;
    const newText = words.join(' ');
    editor.innerText = newText;
    
    // Reapply syntax highlighting
    const highlightedText = highlightSyntax(newText);
    editor.innerHTML = highlightedText;
    placeCaretAtEnd(editor);
}

// Initial population of the sidebar
updateSuggestionBox('attributes', copernicusAttributes, '');
updateSuggestionBox('functions', copernicusFunctions, '');
updateSuggestionBox('dictionaries', copernicusDictionaries, '');
