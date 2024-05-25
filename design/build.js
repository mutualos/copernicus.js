window.buildConfig = {
    libraries: ['organization', 'financial', 'https://fijs.net/api/trates/'],
    version: '1.0.0',
    presentation: {
        columns: [
            { header: 'ID', key: 'ID', type: 'integer' },
            { header: 'Principal', key: 'principal', type: 'currency' },
            { header: 'Result', key: 'result', type: 'float' }
        ],
        primary_key: 'ID',
        sort: { key: 'result', order: 'desc' }
    },
    components: [
        {
            name: 'LoanComponent',
            formula: '((annualRate - trates:12)  * averagePrincipal - originationExpense - servicingExpense) * (1 - taxRate) - loanLossReserve',
            pipeIDs: ['loan', 'lending', 'line']
        },
        {
            name: 'AnotherComponent',
            formula: 'anotherFormula',
            pipeIDs: ['another', 'example']
        }
    ]
};
