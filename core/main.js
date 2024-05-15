document.addEventListener('allLibrariesLoaded', function(e) {
    const loadedLibraries = e.detail;
    console.log('All libraries loaded:', loadedLibraries);

    const headers = ["Portfolio", "Date_Opened", "Maturity_Date", "Branch_Number", "Class_Code", "Opened_by_Resp_Code", "Principal", "Amount_Last_Payment", "Rate_Over_Split", "Status_Code", "Risk_Rating", "Late_Charges"];
    const dataLines = ['123456789,2018-06-15,2038-07-01,1,4,92,161376.77,1466.67,0.0625,0,3,0', '123456790,2017-06-15,2037-07-01,1,4,92,161376.77,1466.67,0.0625,0,3,0'];

    const pipeFormula = "annualRate * averagePrincipal"; // Example formula
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
            const pipeFormula = getFormula(file.name);
            if (pipeFormula) {
                processingPromises.push(readFileAsync(file, pipeFormula, pipeID, loadedLibraries));
            } else {
                console.error(`No matching formula for file ${file.name}. Skipping.`);
            }
        });
    });
});

function getFunctionArgs(func) {
    const args = func.toString().match(/(?:\(|\s)([^)]*)(?:\)|=>)/)[1];
    return args.split(',').map(arg => arg.trim().split('=')[0].trim());
}

function evalFormula(data, formula, translations, libraries) {
    try {
        let processedFormula = formula.replace(/\b(\w+(:\s*\w+)?)\b/g, (match) => {
            if (match.includes(':')) {
                const [dictName, dictKey] = match.split(':').map(s => s.trim());
                for (const library of libraries) {
                    if (window[library][dictName] && window[library][dictName][dictKey] !== undefined) {
                        return window[library][dictName][dictKey];
                    }
                }
                throw new Error(`Dictionary key '${dictKey}' not found in '${dictName}'`);
            }
            
            let translatedMatch = translations.hasOwnProperty(match) ? translations[match] : match;

            if (!isNaN(parseFloat(translatedMatch))) {
                return translatedMatch; // Pass through numbers directly
            }

            for (const library of libraries) {
                const lib = window[library];
                if (typeof lib[translatedMatch] === 'function') {
                    const argsNames = getFunctionArgs(lib[translatedMatch]);
                    const argsValues = argsNames.map(name => {
                        if (data[name] === undefined) return 'null';
                        const value = data[name];
                        // Detect dates and enclose them in quotes
                        if (!isNaN(Date.parse(value))) {
                            return `'${value}'`;
                        }
                        return isNaN(value) ? `'${value}'` : value; // Quote non-numeric values
                    }).join(', ');
                    return `${library}['${translatedMatch}'](${argsValues})`;
                } else if (lib.hasOwnProperty(translatedMatch)) {
                    return lib[translatedMatch];
                }
            }

            if (data.hasOwnProperty(translatedMatch)) {
                const value = data[translatedMatch];
                // Detect dates and enclose them in quotes
                if (!isNaN(Date.parse(value))) {
                    return `'${value}'`;
                }
                return isNaN(value) ? `'${value}'` : value; // Quote non-numeric values
            }
            return '0'; // Default for unrecognized matches
        });

        console.log(processedFormula);  // Debugging output
        return eval(processedFormula); // Evaluate the processed formula string
    } catch (error) {
        console.error('Error evaluating formula:', error);
        return undefined;
    }
}


function processFormula(dataLines, headers, pipeFormula, pipeID, libraries) {
    const translatedHeaders = headers.map(header => translateHeader(pipeID, header));
    console.log('processFormula', headers, translatedHeaders);

    dataLines.forEach(line => {
        const values = line.split(',');
        console.log('values', values);

        const dataObject = translatedHeaders.reduce((obj, header, index) => {
            obj[header] = values[index] ? values[index].trim() : null; // Assign values to translated headers
            return obj;
        }, {});

        console.log('headers:', headers, 'dataObject:', dataObject);
        
        const result = evalFormula(dataObject, pipeFormula, translations[pipeID], libraries);  // pipeID must match translations key
        console.log('result:', result, 'dataObject:', dataObject, 'pipeFormula:', pipeFormula);
    });
}

function showSpinner() { // called by processLargePipeAsync
    console.log("Loading...");
}

function hideSpinner() { // called by processLargePipeAsync
    console.log("Finished.");
}

function processLargePipeAsync(csvText, pipeFormula, pipeID, libraries) {
    showSpinner();
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                const dataLines = csvText.split('\n').filter(line => line.trim());
                const headers = dataLines[0].split(',').map(header => header.trim());
                processFormula(dataLines.slice(1), headers, pipeFormula, pipeID, libraries);
                hideSpinner();
                resolve('Data processed successfully');
            } catch (error) {
                hideSpinner();
                reject(error);
            }
        }, 0);
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

function getFormula(fileName) {
    return 'annualRate * averagePrincipal';
}

function translateHeader(pipeID, csvHeader) {
    const pipeTranslations = translations[pipeID];
    console.log(pipeTranslations);
    if (pipeTranslations && pipeTranslations[csvHeader]) {
        return pipeTranslations[csvHeader];
    }
    return csvHeader;  // Return original if no translation found
}
