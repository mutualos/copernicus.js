document.getElementById('saveButton').addEventListener('click', function() {
    const fileName = document.getElementById('fileNameInput').value;
    const editorContent = document.getElementById('editor').innerText;

    if (!fileName) {
        alert('Please enter a file name.');
        return;
    }

    // Function to identify used pipes in the formula
    function identifyUsedPipes(content) {
        const usedPipes = new Set();
        pipeItems.forEach(pipe => {
            pipe.items.forEach(item => {
                if (content.includes(item)) {
                    usedPipes.add(pipe.category);
                }
            });
        });
        return Array.from(usedPipes);
    }

    // Create a mapping of functions, attributes, and dictionaries to their respective libraries
    const libraryMapping = {
        organization: {
            functions: Object.keys(organization.functions || {}),
            attributes: Object.keys(organization.attributes || {}),
            dictionaries: Object.keys(organization.dictionaries || {})
        },
        financial: {
            functions: Object.keys(financial.functions || {}),
            attributes: Object.keys(financial.attributes || {}),
            dictionaries: Object.keys(financial.dictionaries || {})
        },
        api: {
            functions: Object.keys(api.functions || {}),
            attributes: Object.keys(api.attributes || {}),
            dictionaries: Object.keys(api.dictionaries || {})
        }
        // Add more libraries as needed
    };

    // Split the editor content by semicolons to get individual formulas
    const formulas = editorContent.split(';').map(f => f.trim()).filter(f => f);
    console.log('formulas', formulas);

    function stem(word) {
        console.log('word', word);
        const suffixes = ["ing", "ed", "ly", "es", "s", "ment"];
        let stemmedWord = word;
    
        for (let suffix of suffixes) {
            if (word.endsWith(suffix)) {
                stemmedWord = word.substring(0, word.length - suffix.length);
                break;
            }
        }
    
        return stemmedWord;
    }

    let akaDictionary = {
        'checking': ['dda'],
        'certificate': ['CD', 'COD']
    };

    function populatePipeIDs(pipe) {
        console.log('pipe', pipe);
        let stemmedWord = stem(pipe);
        let aka = akaDictionary && akaDictionary.hasOwnProperty(pipe) ? akaDictionary[pipe] : [];
        return [pipe, stemmedWord, ...aka];
    }

    function identifyLibraries(content) {
        const libraries = new Set();

        for (const [library, { functions, attributes, dictionaries }] of Object.entries(libraryMapping)) {
            for (const func of functions) {
                if (content.includes(func)) {
                    libraries.add(library);
                }
            }
            for (const attr of attributes) {
                if (content.includes(attr)) {
                    libraries.add(library);
                }
            }
            for (const dict of dictionaries) {
                if (content.includes(dict)) {
                    libraries.add(library);
                }
            }
        }

        return Array.from(libraries);
    }

    function generateColumnsString() {
        const columns = [];
        const columnCards = document.querySelectorAll('.column-card');
        
        columnCards.forEach(card => {
            const header = card.querySelector('input[name="header"]').value;
            const key = card.querySelector('input[name="key"]').value;
            const type = card.querySelector('select[name="type"]').value;
            
            if (header && key && type) {
                columns.push({ header, key, type });
            }
        });
    
        const columnsString = columns.map(col => {
            return `\t\t\t\t\t{ header: '${col.header}', key: '${col.key}', type: '${col.type}' }`;
        }).join(',\n');

        const charts = [];
            const chartCards = document.querySelectorAll('.chart-card');

            chartCards.forEach(card => {
                const label = card.querySelector('input[name="chartLabel"]').value;
                const key = card.querySelector('select[name="chartKey"]').value;

                if (label && key) {
                    charts.push({ key, label });
                }
            });

            const chartsString = charts.map(chart => {
                return `{ key: '${chart.key}', label: '${chart.label}' }`;
            }).join(',\n');
    
        const primaryKey = document.getElementById('primaryKey').value;
        const sortKey = document.getElementById('sortKey').value;
        const sortOrder = document.getElementById('sortOrder').value;
    
        return `columns: [\n${columnsString}\n\t\t\t\t],\n\t\t\t\tprimary_key: '${primaryKey}',\n\t\t\t\tsort: { key: '${sortKey}', order: '${sortOrder}',\n\t\t\t\tcharts: [\n\t\t\t\t\t${chartsString}\n\t\t\t\t] }`;
    }

    // Create components based on the formulas
    const components = formulas.map((formula, index) => {
        const usedPipes = identifyUsedPipes(formula);
        console.log('usedPipes', index, usedPipes);
        let componentId = `component_${index}`;
        
        if (usedPipes.length > 0) {
            componentId = usedPipes[index];
        }

        console.log('usedPipes[index]', index, usedPipes[index], usedPipes)
        return {
            id: componentId,
            formula: formula,
            pipeIDs: populatePipeIDs(usedPipes[0]) 
        };
    });

    const libraries = new Set();

    formulas.forEach(formula => {
        identifyLibraries(formula).forEach(lib => libraries.add(lib));
    });

    const fileContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Copernicus Single Page Application</title>
    <link rel="stylesheet" href="../styles/main.css">
</head>
<body>
    <div id="spinnerOverlay" class="spinner-overlay">
        <div class="spinner"></div>
    </div>
    <div id="chartContainer"></div>
    <div id="resultsTableContainer" class="table-container"></div> <!-- Container for results table -->
    <footer class="fixed-footer">
        <input type="file" id="csvPipe" accept=".csv" multiple>
        <button id="run">
            <img src="../JS_box.png" class="button-icon">
            Run
        </button>
    </footer>
    <script>
        window.buildConfig = {
            libraries: ${JSON.stringify(Array.from(libraries), null, 4)},
            version: '${document.getElementById("version").value}',
            presentation: {
                ${generateColumnsString()},
            },
            components: ${JSON.stringify(components, null, 4)}
        };
    </script>
    <script src="../core/loadLibraries.js"></script>
    <script src="../organization/pipes.js"></script>
    <script src="../core/main.js"></script>
</body>
</html>`;

    const blob = new Blob([fileContent], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.html`;
    link.click();
});
