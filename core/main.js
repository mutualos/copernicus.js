document.addEventListener('allLibrariesLoaded', function(e) {
    const loadedLibraries = e.detail;
    console.log('All libraries loaded:', loadedLibraries);
    /*
    // Testing-demo data 
    const headers = ["Portfolio", "Date_Opened", "Maturity_Date", "Branch_Number", "Class_Code", "Opened_by_Resp_Code", "Principal", "Amount_Last_Payment", "Rate_Over_Split", "Status_Code", "Risk_Rating", "Late_Charges"];
    const dataLines = [
        '123456789,2018-06-15,2038-07-01,1,4,92,161376.77,1466.67,0.0625,0,3,0',
        '123456790,2017-06-15,2037-07-01,1,4,92,161376.77,1466.67,0.0625,0,3,0',
        '123456790,2017-06-15,2037-07-01,2,4,92,100000.00,1466.67,0.0625,0,3,0'
    ];
    
    const pipeFormula = '((annualRate - (trates:remainingMonths + marginTarget)/2)  * averagePrincipal - originationExpense - servicingExpense) * (1 - taxRate) - loanLossReserve'; // Example formula
    const pipeID = 'loans'; // Assuming 'loans' is a valid pipeID
    allResults = processFormula(dataLines, headers, pipeFormula, pipeID, loadedLibraries);
    displayResults(allResults);
    */
    const runButton = document.getElementById('run');
    if (runButton) {
        runButton.addEventListener('click', () => {
            const files = document.getElementById('csvPipe').files;
            if (!files.length) {
                console.log("No files selected.");
                return;
            }
        
            const processingPromises = [];
            let allResults = [];
        
            Array.from(files).forEach(file => {
                const result = getFormulaAndPipeIDByComponent(file.name);
                if (result) {
                    const { formula, pipeID } = result;
                    console.log('Processing:', pipeID);
                    processingPromises.push(
                        readFileAsync(file, formula, pipeID, loadedLibraries)
                        .then(fileResults => {
                            allResults = allResults.concat(fileResults);
                        })
                    );
                } else {
                    console.error(`No matching formula for file ${file.name}. Skipping.`);
                }
            });
        
            Promise.all(processingPromises)
                .then(() => {
                    console.log('All files processed successfully');
                    displayResults(allResults);
                })
                .catch(error => {
                    console.error('Error processing files:', error);
                });
        });
    }
});

function getFormulaAndPipeIDByComponent(fileName) {
    const components = window.buildConfig.components;
    for (const component of components) {
        for (const pipeID of component.pipeIDs) {
            if (fileName.includes(pipeID)) {
                return { formula: component.formula, pipeID: component.id };
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
    console.log('data', data)
    try {
        // Step 1: Replace attributes
        let processedFormula = formula.replace(/\b(\w+)\b/g, (match) => {
            if (libraries.attributes && libraries.attributes[match]) {
                return libraries.attributes[match].value;
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
            if (libraries.functions && libraries.functions[match] && typeof libraries.functions[match].implementation === 'function') {
                const argsNames = getFunctionArgs(libraries.functions[match].implementation);
                const argsValues = argsNames.map(name => {
                    if (data[name] === undefined) return 'null';
                    const value = data[name];
                    if (!isNaN(Date.parse(value))) {
                        return `'${value}'`;
                    }
                    return isNaN(value) ? `'${value}'` : value;
                }).join(', ');

                const functionCall = `libraries.functions.${match}.implementation(${argsValues})`;
                console.log('Function call:', functionCall);
                const functionResult = eval(functionCall);
                console.log('Function result:', functionResult);
                return functionResult;
            }
            return match; // Return unchanged if not a function
        });

        console.log('After functions replacement:', processedFormula); // Debugging output

        /*
        // Step 3: Process dictionary lookups
        processedFormula = processedFormula.replace(/\b(\w+:\s*\w+)\b/g, (match) => {
            const [dictName, dictKey] = match.split(':').map(s => s.trim());
            if (libraries.dictionaries && libraries.dictionaries[dictName] && libraries.dictionaries[dictName].values[dictKey] !== undefined) {
                return libraries.dictionaries[dictName].values[dictKey];
            }
            throw new Error(`Dictionary key '${dictKey}' not found in '${dictName}'`);
        });
        */
        // Step 3: Process dictionary lookups
        processedFormula = processedFormula.replace(/\b(\w+):\s*['"]?(\w+)['"]?\b/g, (match, dictName, dictKey) => {
            //console.log('Dictionary Lookup - Match:', match);
            //console.log('Dictionary Lookup - dictName:', dictName);
            //console.log('Dictionary Lookup - dictKey:', dictKey);
            if (libraries.dictionaries && libraries.dictionaries[dictName] && libraries.dictionaries[dictName].values[dictKey] !== undefined) {
                const dictValue = libraries.dictionaries[dictName].values[dictKey];
                //console.log('Dictionary Lookup - dictValue:', dictValue);
                return `${dictValue}`;
            }
            throw new Error(`Dictionary key '${dictKey}' not found in '${dictName}'`);
        });
        processedFormula = processedFormula.replace(/['"]+/g, ''); //// Remove any trailing quotes introduced during replacements
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

    const columns = window.buildConfig.presentation.columns.map(col => col.key);

    dataLines.forEach(line => {
        const values = line.split(',');
        const dataObject = translatedHeaders.reduce((obj, header, index) => {
            obj[header] = values[index] ? values[index].trim() : null; // Assign values to translated headers
            return obj;
        }, {});

        // Evaluate function columns before the main formula
        columns.forEach(column => {
            const columnConfig = window.buildConfig.presentation.columns.find(col => col.key === column);
            if (columnConfig && columnConfig.type === 'function') {
                const functionFormula = columnConfig.function;
                const columnPipeID = columnConfig.pipeID || pipeID; // Use the column's pipeID if available, otherwise use the main pipeID
                dataObject[columnConfig.key] = evalFormula(dataObject, functionFormula, translations[columnPipeID], libraries);
            }
        });

        const result = evalFormula(dataObject, pipeFormula, translations[pipeID], libraries);
        const id = dataObject['ID'] || dataObject[Object.keys(dataObject)[0]]; // Use 'ID' or first key if 'ID' is not available

        const limitedDataObject = { id };
        columns.forEach(column => {
            if (column in dataObject) {
                limitedDataObject[column] = dataObject[column];
            }
        });

        if (result !== null) { // Exclude null results
            results.push({ ...limitedDataObject, result }); // Store result with ID and required columns
        }
    });

    return results; // Return results to be resolved
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
    const chartConfig = window.buildConfig.presentation.chart;

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
                if (column.key !== primaryKey) {
                    const currentVal = combinedResults[primaryKeyValue][column.key];
                    const newVal = result[column.key];
                    if (column.type === 'category') {
                        combinedResults[primaryKeyValue][column.key] = newVal;
                    } else if (!isNaN(parseFloat(newVal)) && !isNaN(parseFloat(currentVal))) {
                        combinedResults[primaryKeyValue][column.key] = parseFloat(currentVal) + parseFloat(newVal);
                    } else if (!currentVal) {
                        combinedResults[primaryKeyValue][column.key] = newVal;
                    } else if (String(currentVal).includes("undefined") || String(currentVal).includes("NaN")) {
                        combinedResults[primaryKeyValue][column.key] = parseFloat(newVal) || 0;
                    } else if (!newVal || isNaN(newVal)) {
                        combinedResults[primaryKeyValue][column.key] = currentVal;
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
            let value = result[column.key];

            // Format the value based on the type
            if (value === undefined || value === null || value === '') {
                value = '';
            } else {
                switch (column.type) {
                    case 'integer': 
                        value = parseInt(value, 10);
                        if (isNaN(value)) value = 0;
                        break;
                    case 'float':
                        value = parseFloat(value).toFixed(2);
                        if (isNaN(value)) value = '0.00';
                        break;
                    case 'currency':
                        value = parseFloat(value).toFixed(2);
                        if (isNaN(value)) {
                            value = '$0.00';
                        } else {
                            value = `$${value}`;
                        }
                        break;
                    case 'percentage':
                        value = parseFloat(value * 100).toFixed(2);
                        if (isNaN(value)) {
                            value = '0.00%';
                        } else {
                            value = `${value}%`;
                        }
                        break;
                    case 'upper':
                        value = value.toUpperCase();
                        break;
                    case 'category':
                        if(translations[column.key][value]) {
							value = translations[column.key][value];
						}
                        //value = parseInt(value, 10);
                        //if (isNaN(value)) value = 0;
                        break;
                    default:
                        value = value;
                }
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

    if (window.buildConfig.presentation.chart) {
        // Create the chart container and canvas
        const chartContainer = document.getElementById('chartContainer');
        chartContainer.innerHTML = '<canvas id="branch_chart"></canvas>';
        const ctx = document.getElementById('branch_chart').getContext('2d');

        // Prepare data for the chart
        const chartResults = {};
        combinedResultsArray.forEach(result => {
            const chartValue = result[chartConfig.key];
            if (chartResults[chartValue]) {
                chartResults[chartValue] += parseFloat(result.result);
            } else {
                chartResults[chartValue] = parseFloat(result.result);
            }
        });

        const chartLabels = Object.keys(chartResults);
        const chartData = Object.values(chartResults);

        // Create the chart
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: chartConfig.label,
                    data: chartData,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
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
            const results = processFormula(dataLines.slice(1), headers, pipeFormula, pipeID, libraries);
            resolve(results);
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
                .then(result => resolve(result))
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
