const financial = {
    interestIncome: function(principal, annualRate) {
        console.log(principal, annualRate)
        return principal * annualRate;
    },

    remainingMonths: function(maturityDate) {
        if (!maturityDate) return null;
        const today = new Date();
        const maturity = new Date(maturityDate);
        const months = (maturity.getFullYear() - today.getFullYear()) * 12 + maturity.getMonth() - today.getMonth();
        console.log('maturityDate, months', maturityDate, months);
        return months > 0 ? months : 0;
    },

    calculateLoanPayment: function(principal, annualRate, amortizationMonths) {
        //console.log('principal, annualRate, amortizationMonths', principal, annualRate, amortizationMonths)
        // From LendersIQ $pni = $principal * $mrate / (1 - (pow(1/(1 + $mrate), $amort)));
        const monthlyRate = annualRate < 1 ? parseFloat(annualRate) / 12 : parseFloat(annualRate / 100) / 12;
        if (monthlyRate === 0) { // Handling the case where the annual rate is 0
            return (principal / amortizationMonths).toFixed(2);
        }
        const monthlyPayment = principal * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -amortizationMonths)));
        return monthlyPayment.toFixed(2);
    },

    averagePrincipal: function(principal, annualRate, termMonths = null, amortizationMonths = null, maturityDate = null) {
        console.log('principal, annualRate, termMonths, amortizationMonths, maturityDate', principal, annualRate, termMonths, amortizationMonths, maturityDate)
        if (parseFloat(principal) <= 0) return 0.00;
        var monthlyRate = annualRate < 1 ? parseFloat(annualRate) / 12 : parseFloat(annualRate / 100) / 12;
        
        // Determine the term based on maturityDate or use termMonths directly
        var remainingMonths = maturityDate ? financial.remainingMonths(maturityDate) : termMonths;
        
        if (remainingMonths === null || remainingMonths <= 0) {
            console.log('averagePrincipal: Invalid termMonths or maturityDate. Please provide a valid maturityDate or termMonths.', principal, annualRate, remainingMonths);
            return 0.00; // Exit the function if no valid term is provided
        }
        const amortization = isNaN(amortizationMonths) ? remainingMonths : Math.max(amortizationMonths, remainingMonths);
        const payment = financial.calculateLoanPayment(principal, annualRate, amortization);
        console.log('loan payment (averagePrincipal):', payment);
        const months = Math.max(Math.min(remainingMonths, 360), 1); // Limit term to 1-360 months for safety
        var principalTemp = parseFloat(principal);
        var principalSum = 0;
        var month = 0;
        while (month < months && principalTemp > 0) {
            principalSum += principalTemp;
            principalTemp -= payment - principalTemp * monthlyRate;
            month++;
            
        }
        averagePrincipal = parseFloat(principalSum / months);
    
        if (averagePrincipal < 0) {
            console.log('Warning: Average outstanding below zero.');
        }
        console.log('average principal:', averagePrincipal.toFixed(2))
        return averagePrincipal.toFixed(2);
    },

    originationExpense: function(type) {
        console.log(type, organization.loanTypeName);
        return 1;
    },

    //copernicus.js attributes
    feeIncome: 1000,  
    //copernicus.js dictionaries
    "OriginationCost": {
        "Agriculture": 0.01,
        "Commercial":0.01, 
        "Commercial Real Estate": 0.015,
        "Residential Real Estate": 0.015,
        "Consumer": 0.0070,
        "Equipment": 0.0085, 
        "Home Equity": 0.015,
        "Letter of Credit": 0.00775,
        "Commercial Line": 0.0080,
        "Commercial CD Secured": 0.0085,
        "Consumer CD Secured": 0.0070,
        "Home Equity Line of Credit": 0.015,
        "Municipal": 0.01,
        "Tax Exempt Commercial": 0.01,
        "Tax Exempt Commercial Real Estate": 0.012
    },
    "principalCostCaps": {
        "Agriculture": 1500000,
        "Commercial": 1500000,
        "Commercial Real Estate": 2500000,
        "Residential Real Estate": 500000,
        "Consumer": 100000,
        "Equipment": 500000,
        "Home Equity": 200000,
        "Letter of Credit": 1500000,
        "Commercial Line": 1500000,
        "Commercial CD Secured": 1500000,
        "Consumer CD Secured": 100000,
        "Home Equity Line of Credit": 200000,
        "Municipal": 1500000, 
        "Tax Exempt Commercial": 1500000,
        "Tax Exempt Commercial Real Estate": 2500000
    },
};

window.financial = financial; // Make it globally accessible if not using modules
