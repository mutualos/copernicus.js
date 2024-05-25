document.addEventListener('allLibrariesLoaded', function(e) {
    const loadedLibraries = e.detail;
    console.log('All libraries loaded:', loadedLibraries);
    // Testing-demo data 
    const headers = ["Portfolio", "Date_Opened", "Maturity_Date", "Branch_Number", "Class_Code", "Opened_by_Resp_Code", "Principal", "Amount_Last_Payment", "Rate_Over_Split", "Status_Code", "Risk_Rating", "Late_Charges"];
    const dataLines = [
        '123456789,2018-06-15,2038-07-01,1,4,92,161376.77,1466.67,0.0625,0,3,0',
        '123456790,2017-06-15,2037-07-01,1,4,92,161376.77,1466.67,0.0625,0,3,0',
        '123456790,2017-06-15,2037-07-01,1,4,92,100000.00,1466.67,0.0625,0,3,0'
    ];
    const pipeFormula = '((annualRate - trates:remainingMonths)  * averagePrincipal - originationExpense - servicingExpense) * (1 - taxRate) - loanLossReserve'; // Example formula
    const pipeID = 'loans'; // Assuming 'loans' is a valid pipeID
    processFormula(dataLines, headers, pipeFormula, pipeID, loadedLibraries);

    document.getElementById('run').addEventListener('click', () => {
        const files = document.getElementById('csvPipe').files;
        if (!files.length) {
            console.log("No files selected.");
            return;
        }
        const processingPromises = [];
        Array.from(files).forEach(file => {
            const pipeFormula =  getFormulaByComponent(file.name);
            if (pipeFormula) {
                processingPromises.push(readFileAsync(file, pipeFormula, pipeID, loadedLibraries));
            } else {
                console.error(`No matching formula for file ${file.name}. Skipping.`);
            }
        });
    });
});

function getFormulaByComponent(fileName) {
    const components = window.buildConfig.components;
    for (const component of components) {
        for (const pipeID of component.pipeIDs) {
            if (fileName.includes(pipeID)) {
                return component.formula;
            }
        }
    }
    return null;
}

function getFunctionArgs(func) {
    const args = func.toString().match(/(?:\(|\s)([^)]*)(?:\)|=>)/)[1];
    return args.split(',').map(arg => arg.trim().split('=')[0].trim());
}

function evalFormula(data, formula, translations, libraries) {
    //console.log('Libraries object:', libraries);

    try {
        // Step 1: Replace attributes
        let processedFormula = formula.replace(/\b(\w+)\b/g, (match) => {
            if (libraries.hasOwnProperty(match) && typeof libraries[match] !== 'function' && typeof libraries[match] !== 'object') {
                return libraries[match];
            } else if (data.hasOwnProperty(match)) {
                const value = data[match];
                if (!isNaN(Date.parse(value))) {
                    return `'${value}'`;
                }
                return isNaN(value) ? `'${value}'` : value;
            }
            return match; // Return unchanged if not an attribute
        });

        console.log('After attributes replacement:', processedFormula); // Debugging output

        // Step 2: Replace functions
        processedFormula = processedFormula.replace(/\b(\w+)\b/g, (match) => {
            if (typeof libraries[match] === 'function') {
                const argsNames = getFunctionArgs(libraries[match]);
                const argsValues = argsNames.map(name => {
                    if (data[name] === undefined) return 'null';
                    const value = data[name];
                    if (!isNaN(Date.parse(value))) {
                        return `'${value}'`;
                    }
                    return isNaN(value) ? `'${value}'` : value;
                }).join(', ');

                const functionCall = `libraries.${match}(${argsValues})`;
                //console.log('Function call:', functionCall);
                const functionResult = eval(functionCall);
                //console.log('Function result:', functionResult);
                return functionResult;
            }
            return match; // Return unchanged if not a function
        });

        console.log('After functions replacement:', processedFormula); // Debugging output

        // Step 3: Process dictionary lookups
        processedFormula = processedFormula.replace(/\b(\w+:\s*\w+)\b/g, (match) => {
            const [dictName, dictKey] = match.split(':').map(s => s.trim());
            if (libraries[dictName] && libraries[dictName][dictKey] !== undefined) {
                return libraries[dictName][dictKey];
            }
            throw new Error(`Dictionary key '${dictKey}' not found in '${dictName}'`);
        });

        console.log('Final processed formula:', processedFormula); // Debugging output
        return eval(processedFormula); // Evaluate the final formula string
    } catch (error) {
        console.error('Error evaluating formula:', error);
        return undefined;
    }
}

function processFormula(dataLines, headers, pipeFormula, pipeID, libraries) {
    const translatedHeaders = headers.map(header => translateHeader(pipeID, header));
    const results = []; // Array to store results

    dataLines.forEach(line => {
        const values = line.split(',');
        const dataObject = translatedHeaders.reduce((obj, header, index) => {
            obj[header] = values[index] ? values[index].trim() : null; // Assign values to translated headers
            return obj;
        }, {});
        
        const result = evalFormula(dataObject, pipeFormula, translations[pipeID], libraries);  // pipeID must match translations key
        console.log('result:', result, 'dataObject:', dataObject, 'pipeFormula:', pipeFormula);

        const id = dataObject['ID'] || dataObject[Object.keys(dataObject)[0]]; // Use 'ID' or first key if 'ID' is not available
        results.push({ ...dataObject, result, id }); // Store result with ID
    });

    displayResults(results); // Call display function after processing
}

function displayResults(results) {
    const tableContainer = document.getElementById('resultsTableContainer');
    tableContainer.innerHTML = ''; // Clear previous results

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    const headerRow = document.createElement('tr');
    const columns = window.buildConfig.presentation.columns;
    const primaryKey = window.buildConfig.presentation.primary_key;
    const sortConfig = window.buildConfig.presentation.sort;

    // Create table headers based on the presentation settings
    columns.forEach(column => {
        const th = document.createElement('th');
        th.textContent = column.header;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Combine rows with the same primary key
    const combinedResults = {};

    results.forEach(result => {
        const primaryKeyValue = result[primaryKey];
        if (!combinedResults[primaryKeyValue]) {
            combinedResults[primaryKeyValue] = { ...result, count: 1 };
        } else {
            columns.forEach(column => {
                if (column.key !== primaryKey && result[column.key]) {
                    const currentVal = combinedResults[primaryKeyValue][column.key];
                    const newVal = result[column.key];
                    if (!isNaN(parseFloat(newVal)) && !isNaN(parseFloat(currentVal))) {
                        combinedResults[primaryKeyValue][column.key] = parseFloat(currentVal) + parseFloat(newVal);
                    } else {
                        combinedResults[primaryKeyValue][column.key] = `${currentVal}, ${newVal}`;
                    }
                }
            });
            combinedResults[primaryKeyValue].count += 1;
        }
    });

    // Convert combined results back to an array
    const combinedResultsArray = Object.values(combinedResults);

    // Sort the combined results
    combinedResultsArray.sort((a, b) => {
        if (sortConfig.order === 'asc') {
            return a[sortConfig.key] - b[sortConfig.key];
        } else {
            return b[sortConfig.key] - a[sortConfig.key];
        }
    });

    // Display the sorted results
    combinedResultsArray.forEach(result => {
        const row = document.createElement('tr');
        columns.forEach(column => {
            const td = document.createElement('td');
            let value = result[column.key] || '';

            // Format the value based on the type
            switch (column.type) {
                case 'integer':
                    value = parseInt(value, 10);
                    break;
                case 'float':
                    value = parseFloat(value).toFixed(2);
                    break;
                case 'currency':
                    value = `$${parseFloat(value).toFixed(2)}`;
                    break;
                case 'percentage':
                    value = `${parseFloat(value * 100).toFixed(2)}%`;
                    break;
                default:
                    value = value;
            }

            // Add count to primary key value if there are duplicates
            if (column.key === primaryKey && result.count > 1) {
                value += ` (${result.count})`;
            }

            td.textContent = value;
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    tableContainer.appendChild(table);
}

function showSpinner() {
    document.getElementById('spinnerOverlay').style.visibility = 'visible';
}

function hideSpinner() {
    setTimeout(() => {
        document.getElementById('spinnerOverlay').style.visibility = 'hidden';
    }, 500); // Adjust the delay as needed (e.g., 500ms)
}

function processLargePipeAsync(csvText, pipeFormula, pipeID, libraries) {
    showSpinner();
    return new Promise((resolve, reject) => {
        try {
            const dataLines = csvText.split('\n').filter(line => line.trim());
            const headers = dataLines[0].split(',').map(header => header.trim());
            processFormula(dataLines.slice(1), headers, pipeFormula, pipeID, libraries);
            resolve('Data processed successfully');
        } catch (error) {
            reject(error);
        }
    }).then(result => {
        hideSpinner();
        return result;
    }).catch(error => {
        hideSpinner();
        throw error;
    });
}

function readFileAsync(file, pipeFormula, pipeID, libraries) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const text = e.target.result;
            processLargePipeAsync(text, pipeFormula, pipeID, libraries)
                .then(resolve)
                .catch(reject);
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

function translateHeader(pipeID, csvHeader) {
    const pipeTranslations = translations[pipeID];
    if (pipeTranslations && pipeTranslations[csvHeader]) {
        return pipeTranslations[csvHeader];
    }
    return csvHeader;  // Return original if no translation found
}
