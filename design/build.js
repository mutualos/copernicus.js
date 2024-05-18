window.buildConfig = {
    libraries: ['organization', 'financial', 'api'], // replace 'api' with  URL of API, List the libraries your SPA needs
    formula: 'calculateInterest + feeIncome / 12', // Default formula (example)
    version: '1.0.0', // Version of the build
    presentation: {
        columns: [
            { header: 'ID', key: 'ID' }, // Display ID in column 1
            { header: 'Principal', key: 'principal' }, // Display principal in column 2
            { header: 'Result', key: 'result' } // Display result in column 3
        ]
    }
};
