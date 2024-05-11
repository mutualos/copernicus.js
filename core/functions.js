const fiFunctions = {
    inflationAdjustment: function(baseRate, adjustment) {
        console.log(`inflationAdjustment params: baseRate=${baseRate}, adjustment=${adjustment}`);
        return baseRate + adjustment;
    },
   
    calculateInterest: function(principal, rate, term) {
        console.log(`calculateInterest params: principal=${principal}, rate=${rate}, term=${term}`);
        return principal * rate * term;
    }
}
