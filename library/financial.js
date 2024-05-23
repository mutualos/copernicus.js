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

    loanLossReserve: function(type, principal, annualRate, riskRating, LTV = null, guarantee = null, termMonths = null, amortizationMonths = null, maturityDate = null) {
        if (parseFloat(principal) <= 0) return 0.00;
        if (typeof organization.loanTypeID === 'object') {
			typeIDs = organization.loanTypeID;
			let identifiedType = null;
			for (let key in typeIDs) {
				if (typeIDs[key].includes(type)) {
					identifiedType = key;
					break;
				}
			}
            if (identifiedType !== null) {
                const expectedLoss = financial.loanDefaultRates[identifiedType]; 
                let riskFactor = 1;
                if (organization.loanRiskFactors[riskRating]) {
                    riskFactor = organization.loanRiskFactors[riskRating]; 
                } 
                let monthlyRate = annualRate < 1 ? parseFloat(annualRate) / 12 : parseFloat(annualRate / 100) / 12;
                // Determine the term based on maturityDate or use termMonths directly
                let remainingMonths = maturityDate ? financial.remainingMonths(maturityDate) : termMonths;
                if (remainingMonths === null || remainingMonths <= 0) {
                    console.log('@loanLossReserve: Invalid termMonths or maturityDate. Please provide a valid maturityDate or termMonths.', principal, annualRate, remainingMonths);
                    return 0.00; // Exit the function if no valid term is provided
                }   
                const amortization = isNaN(amortizationMonths) ? remainingMonths : Math.max(amortizationMonths, remainingMonths);
                const payment = financial.calculateLoanPayment(principal, annualRate, amortization);

                const months = Math.max(Math.min(remainingMonths, 360), 1); // Limit term to 1-360 months for safety
                if (guarantee === 1) {
                    defaultRecovery = defaultRecovery * 1.5;
                }
                if (LTV === null) { //if Loan-to-value (LTV) is not included, principal * defaultRecovery
                    LTV = 1;
                }
                let recoveryValue = principal / LTV * financial.defaultRecoveryPerc;  //need many safety checks
                let principalTemp = parseFloat(principal);
                let lossReserve = 0;
                let month = 0;
                let exposureAtDefault = principalTemp - recoveryValue; 
                while (month < months && principalTemp > 0) {
                    if (exposureAtDefault > 0) {
                        lossReserve += expectedLoss * exposureAtDefault / 12;
                    }
                    lossReserve += financial.minOperatingRisk * principalTemp / 12;
                    principalTemp -= payment - principalTemp * monthlyRate;
                    exposureAtDefault = principalTemp - recoveryValue;
                    month++;
                }
                lossReserve = lossReserve / months * 12 * riskFactor;
                console.log('Loan loss reserve: ', lossReserve.toFixed(2));
                return lossReserve.toFixed(2);
            } else {
				console.error('type not found in organization.loanTypeID');
			}
        } else {
			console.log('libary/organization.js is missing loanTypeID see financial.js library docs')
		}
    },

    originationExpense: function(type, principal,  termMonths = null, maturityDate = null) {
		if (typeof organization.loanTypeID === 'object') {
			typeIDs = organization.loanTypeID;
			let identifiedType = null;
			for (let key in typeIDs) {
				if (typeIDs[key].includes(type)) {
					identifiedType = key;
					break;
				}
			}
			if (identifiedType !== null) {
				const months = maturityDate ? financial.remainingMonths(maturityDate) : termMonths;
				const originationFactor = financial.originationFactor[identifiedType];
				const principalCostMax = financial.principalCostMax[identifiedType];
				const principalCostMin = principalCostMax / 10;
				let expense = Math.max(principalCostMin, Math.min(principalCostMax, principal)) * originationFactor / Math.max(months, 60) * 12; //term nust be recouped in the first 60 months
				return expense.toFixed(2);
			} else {
				console.error('type not found in organization.loanTypeID');
			}
		} else {
			console.log('libary/organization.js is missing loanTypeID see financial.js library docs')
		}
    },

    servicingExpense: function(principal,  termMonths = null, maturityDate = null) {
		if (financial.loanServicingFactor) {
            const months = maturityDate ? financial.remainingMonths(maturityDate) : termMonths;
            let expense = principal * financial.loanServicingFactor / months * 12; //term nust be recouped in the first 60 months
            return expense.toFixed(2);
		} else {
			console.log('libary/financial.js is missing loanServicingFactor see financial.js library docs')
		}
    },

    //copernicus.js attributes
    loanServicingFactor: 0.0025,
    defaultRecoveryPerc: 0.50,
    minOperatingRisk: 0.0015,
    depositUnitCost: 2,
	withdrawalUnitCost: 0.11,
    ddaReserveRequired: 0.10,
    savingsCost: 48,

    //copernicus.js dictionaries
    "originationFactor": {
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
    "principalCostMax": {
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
    "loanDefaultRates": {
        "Agriculture": 0.0013,
        "Commercial": 0.0040,
        "Commercial Real Estate": 0.0024,
        "Residential Real Estate": 0.0012,
        "Consumer": 0.0265,
        "Equipment": 0.0040,
        "Home Equity": 0.0012,
        "Letter of Credit": 0.0040,
        "Commercial Line": 0.0040,
        "Commercial CD Secured": 0.0040,
        "Consumer CD Secured": 0.0265,
        "Home Equity Line of Credit": 0.0012,
        "Municipal": 0.0040, 
        "Tax Exempt Commercial": 0.0040,
        "Tax Exempt Commercial Real Estate": 0.0024
    },
};

window.financial = financial; // Make it globally accessible if not using modules
