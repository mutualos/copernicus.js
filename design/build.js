window.buildConfig = {
    libraries: ['organization', 'financial', 'https://fijs.net/api/trates/'], // List the libraries your SPA needs
    formula: 'calculateInterest + feeIncome / 12', // Default formula (example)
    version: '1.0.0', // Version of the build
    presentation: {
        columns: [
            { header: 'ID', key: 'ID', type: 'integer' }, // Display ID in column 1
            { header: 'Principal', key: 'principal', type: 'currency' }, // Display principal in column 2
            { header: 'Result', key: 'result', type: 'float' } // Display result in column 3
        ]
    }
};
