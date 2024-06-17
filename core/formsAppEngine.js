function getFunctionParameters(func) {
    const funcString = func.toString();
    const paramMatch = funcString.match(/\(([^)]*)\)/);
    if (!paramMatch) return [];

    const params = paramMatch[1].split(',').map(param => param.trim());
    return params.map(param => ({
        name: param.replace(/=.*$/, '').trim(),
        optional: /=\s*null/.test(param)
    }));
}

function determineParameterTypeFromUsage(func, param) {
    const funcString = func.toString();
    const body = funcString.slice(funcString.indexOf('{') + 1, funcString.lastIndexOf('}'));

    // Detect select type by checking for inclusion in identifyType function
    const selectRegex = new RegExp(`identifyType\\(${param},\\s*libraries\\.dictionaries\\.([^\\.]+)\\.values\\)`);
    const selectMatch = selectRegex.exec(body);
    if (selectMatch) {
        return { type: 'select', options: [], dictionary: selectMatch[1] };
    }

    // Detect date type by checking for Date related operations
    const dateRegex = new RegExp(`\\bnew Date\\b|\\bDate\\b|\\bmaturityDate\\b`);
    if (dateRegex.test(body) && param.toLowerCase().includes('date')) {
        return { type: 'date' };
    }

    // Detect number type by checking for mathematical operations
    const numberRegex = new RegExp(`\\b${param}\\b.*[+\\-*/]|\\bMath\\.|\\bparseFloat\\(|\\bNumber\\(`);
    if (numberRegex.test(body)) {
        return { type: 'number' };
    }

    // Default to text input if type is unknown
    return { type: 'text' };
}

function createFormConfigFromFunction(func) {
    const parameters = getFunctionParameters(func);
    return parameters.map(param => {
        const paramConfig = determineParameterTypeFromUsage(func, param.name);
        return {
            name: param.name,
            ...paramConfig,
            label: param.name.split(/(?=[A-Z])/).join(' ').replace(/^\w/, c => c.toUpperCase()),
            optional: param.optional
        };
    });
}

function populateSelectOptions(parameter) {
    // Use the dictionary identified in the determineParameterTypeFromUsage function
    if (parameter.dictionary && libraries.dictionaries[parameter.dictionary] && libraries.dictionaries[parameter.dictionary].values) {
        parameter.options = Object.keys(libraries.dictionaries[parameter.dictionary].values);
    }
}

function renderForm(config) {
    const form = document.createElement('form');

    config.parameters.forEach(param => {
        const label = document.createElement('label');
        label.textContent = param.label + (param.optional ? ' (optional)' : '');
        form.appendChild(label);

        let input;
        if (param.type === 'select') {
            input = document.createElement('select');
            input.name = param.name;
            const optionElement = document.createElement('option'); // Add a default empty option
            input.appendChild(optionElement);
            param.options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option;
                input.appendChild(optionElement);
            });
        } else {
            input = document.createElement('input');
            input.type = param.type;
            input.name = param.name;
        }

        if (param.optional) {
            input.required = false;
        } else {
            input.required = true;
        }

        form.appendChild(input);
    });

    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = 'Submit';
    form.appendChild(submitButton);

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        Object.keys(data).forEach(key => {
            if (data[key] === "") {
                data[key] = 'null';
            }
        });
        handleFormSubmission(data);
    });

    document.getElementById('form-container').appendChild(form);
}

function handleFormSubmission(data) {
    console.log('formData', data);
    const headers = Object.keys(data);
    const translations = {};
    for (const key in headers) {
        if (headers.hasOwnProperty(key)) {
            const value = headers[key];
            translations[value] = value;
        }
    }
    const result = evalFormula(data, buildConfig.formula, translations, libraries);
    displayResult(result);
}

function displayResult(result) {
    const resultContainer = document.getElementById('result-container');
    resultContainer.textContent = `Result: ${result.toFixed(2)}`;
}

function extractFunctionsAndPipesFromFormula(formula) {
    const functionMatches = formula.match(/[a-zA-Z_]\w*/g) || [];
    const pipeMatches = formula.match(/([a-zA-Z_]\w*)\s*:\s*([a-zA-Z_]\w*)/g) || [];

    console.log('Function Matches:', functionMatches);
    console.log('Pipe Matches:', pipeMatches);

    const dictionaries = pipeMatches.map(pipe => pipe.split(/\s*:\s*/)[0]);
    const validFunctions = functionMatches.filter(match => libraries.functions.hasOwnProperty(match));
    const pipes = pipeMatches.map(pipe => {
        const [dictionary, value] = pipe.split(/\s*:\s*/);
        console.log(`Extracted dictionary: ${dictionary}, value: ${value}`);
        return value;
    });

    console.log('Filtered Functions:', validFunctions);
    console.log('Extracted Pipes:', pipes);

    // Include standalone variables in valid functions if not already included
    const standaloneVars = functionMatches.filter(match => 
        !validFunctions.includes(match) && !pipes.includes(match) && !dictionaries.includes(match) && !libraries.attributes.hasOwnProperty(match)
    );
    console.log('Standalone Variables:', standaloneVars);
    validFunctions.push(...standaloneVars);

    console.log('Final Functions:', validFunctions);
    console.log('Final Pipes:', pipes);

    return { functions: validFunctions, pipes };
}

function initializeForm() {
    document.getElementById('appTitle').innerHTML = window.buildConfig.title;
    const { functions, pipes } = extractFunctionsAndPipesFromFormula(buildConfig.formula);

    let formConfig = [];

    functions.forEach(funcName => {
        const func = libraries.functions[funcName]?.implementation;
        if (func) {
            const funcConfig = createFormConfigFromFunction(func);
            funcConfig.forEach(param => {
                if (!formConfig.some(existingParam => existingParam.name === param.name)) {
                    formConfig.push(param);
                }
            });
        } else {
            if (!formConfig.some(existingParam => existingParam.name === funcName)) {
                formConfig.push({
                    name: funcName,
                    type: 'number', // Assuming standalone variables are numbers for simplicity
                    label: funcName.split(/(?=[A-Z])/).join(' ').replace(/^\w/, c => c.toUpperCase()),
                    optional: false
                });
            }
        }
    });

    pipes.forEach(pipeName => {
        if (!formConfig.some(existingParam => existingParam.name === pipeName)) {
            formConfig.push({
                name: pipeName,
                type: 'number', // Assuming pipes are numbers for simplicity
                label: pipeName.split(/(?=[A-Z])/).join(' ').replace(/^\w/, c => c.toUpperCase()),
                optional: false
            });
        }
    });

    console.log('Final Form Config:', formConfig);

    // Populate options for select fields dynamically
    formConfig.forEach(param => {
        if (param.type === 'select') {
            populateSelectOptions(param);
        }
    });

    renderForm({ parameters: formConfig });
}

document.addEventListener('allLibrariesLoaded', function (e) {
    initializeForm();
});
