document.addEventListener('libraryLoaded', function(e) {
    if (e.detail === 'financial') {
        //library ready
    
        //testing
        console.log(translateHeader('loans', 'Principal'));  // Expected output: "principal"
        console.log(translateHeader('loans', 'UnknownHeader'));  // Expected output: "UnknownHeader"
        // Sample headers and CSV data
        const headers = ["Portfolio", "Date_Opened", "Maturity_Date", "Branch_Number", "Class_Code", "Opened_by_Resp_Code", "Principal", "Amount_Last_Payment", "Rate_Over_Split", "Status_Code", "Risk_Rating", "Late_Charges"];
        const dataLines = ['123456789,2018-06-15,2038-07-01,1,4,92,161376.77,1466.67,0.0625,0,3,0', '123456790,2017-06-15,2037-07-01,1,4,92,161376.77,1466.67,0.0625,0,3,0'];

        const pipeFormula = "annualRate * averagePrincipal"; // Ensure this formula makes sense based on `financial` methods
        const pipeID = 'loans'; // Assuming 'loans' is a valid pipeID
        processFormula(dataLines, headers, pipeFormula, pipeID);
    }
});

function getFunctionArgs(func) {
    const args = func.toString().match(/(?:\(|\s)([^)]*)(?:\)|=>)/)[1];
    return args.split(',').map(arg => arg.trim().split('=')[0].trim());
}

function evalFormula(data, formula, translations) {
    const financial = window.financial;  // Access the globally available financial object

    try {
        let processedFormula = formula.replace(/\b(\w+)\b/g, (match) => {
            // Apply translation if available
            let translatedMatch = translations.hasOwnProperty(match) ? translations[match] : match;

            if (!isNaN(parseFloat(translatedMatch))) {
                return translatedMatch; // Pass through numbers directly
            }
            else if (typeof financial[translatedMatch] === 'function') {
                // Retrieve function argument names
                const argsNames = getFunctionArgs(financial[translatedMatch]);
                // Map argument names to their corresponding values in data, include only if available
                const argsValues = argsNames.map(name => {
                    return data[name] !== undefined ? `data['${name}']` : 'undefined';  // Pass 'undefined' to maintain optional params
                }).join(', ');
                return `financial['${translatedMatch}'](${argsValues})`;
            }
            else if (financial.hasOwnProperty(translatedMatch) || data.hasOwnProperty(translatedMatch)) {
                return financial[translatedMatch] !== undefined ? financial[translatedMatch] : data[translatedMatch];
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

function processFormula(dataLines, headers, pipeFormula, pipeID) {
    // Translate headers to match function parameters
    const translatedHeaders = headers.map(header => translateHeader(pipeID, header));
    console.log(translatedHeaders);
    console.log(dataLines)
    dataLines.forEach(line => {
        const values = line.split(',');
        console.log('values', values);
        const dataObject = translatedHeaders.reduce((obj, header, index) => {
            obj[header] = values[index].trim(); // Assign values to translated headers
            return obj;
        }, {});
        console.log(headers, dataObject)
        // Evaluate the formula with the translated data
        const result = evalFormula(dataObject, pipeFormula, translations[pipeID]);  //pipeID must match translations key
        console.log(result, dataObject, pipeFormula);
    });
}


function showSpinner() { // called by processLargePipeAsync
    // Code to display spinner
    console.log("Loading...");
}

function hideSpinner() { // called by processLargePipeAsync
    // Code to hide spinner
    console.log("Finished.");
}

function processLargePipeAsync(csvText, pipeFormula, pipeID) {
    showSpinner();
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                const dataLines = csvText.split('\n').filter(line => line.trim());
                const headers = dataLines[0].split(',').map(header => header.trim());
                processFormula(dataLines.slice(1), headers, pipeFormula, pipeID);
                hideSpinner();
                resolve('Data processed successfully');
            } catch (error) {
                hideSpinner();
                reject(error);
            }
        }, 0);
    });
}

// This function reads a file and processes its contents asynchronously.
function readFileAsync(file, pipeFormula, pipeID) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const text = e.target.result;
            processLargePipeAsync(text, pipeFormula, pipeID)
                .then(resolve)
                .catch(reject);
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

function getFormula(pipename) {
    // some more logic in the future
    return 'annualRate * averagePrincipal';
}

document.getElementById('run').addEventListener('click', () => {
    const files = document.getElementById('csvPipe').files;
    if (!files.length) {
        //safety check for now, but can be removed when pipes don't include files
        console.log("No files selected.");
        return;
    }
    const processingPromises = [];
    
    // Optionally, clear previous results or state if needed
    // clearPreviousResults needs more development
    // clearPreviousResults();
    
    Array.from(files).forEach(file => {
        const pipeFormula = getFormula(file.name);
        if (pipeFormula) {
            processingPromises.push(readFileAsync(file, pipeFormula, 'loans'));  // <- pipeID is explicit but will be variable in the future
        } else {
            console.error(`No matching formula for file ${file.name}. Skipping.`);
        }
    });
});


function translateHeader(pipeID, csvHeader) {
    const pipeTranslations = translations[pipeID];
    console.log(pipeTranslations);
    if (pipeTranslations && pipeTranslations[csvHeader]) {
        return pipeTranslations[csvHeader];
    }
    return csvHeader;  // Return original if no translation found
}

