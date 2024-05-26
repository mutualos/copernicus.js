window.buildConfig = {
    libraries: ['organization', 'financial', 'https://fijs.net/api/trates/'],
    version: '1.0.0',
    presentation: {
        columns: [
            { header: 'ID', key: 'ID', type: 'integer' },
            { header: 'Principal', key: 'principal', type: 'currency' },
            { header: 'Balance', key: 'balance', type: 'currency' },
            { header: 'Result', key: 'result', type: 'float' }
        ],
        primary_key: 'ID',
        sort: { key: 'result', order: 'desc' }
    },
    components: [
        {
            id: 'loans',
            formula: '((annualRate - trates:12)  * averagePrincipal - originationExpense - servicingExpense) * (1 - taxRate) - loanLossReserve',
            pipeIDs: ['loan', 'lending', 'line']
        },
        {
            id: 'checking',
            formula: 'balance * 0.5',
            pipeIDs: ['check', 'dda']
        }
    ]
};
