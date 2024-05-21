const organization = {
    "loanTypeID": {
        "Agriculture": [],
        "Commercial": ["31", "32", "33", "34"], 
        "Commercial Real Estate": ["4"],
        "Residential Real Estate": ["1"],
        "Consumer": ["20", "21", "22", "23", "26", "70", "71", "76"], 
        "Equipment": [], 
        "Home Equity": ["24", "25", "46"], 
        "Letter of Credit": ["35"],
        "Commercial Line": ["36", "63", "65"], 
        "Commercial CD Secured": ["30", "38", "39"],
        "Consumer CD Secured": ["27", "28", "29"],
        "Home Equity Line of Credit": ["9", "10", "72", "75"],
        "Municipal": ["37"],
        "Tax Exempt Commercial": ["40"],
        "Tax Exempt Commercial Real Estate": ["42"]
    }
}
window.organization = organization; // Make it globally accessible if not using modules
