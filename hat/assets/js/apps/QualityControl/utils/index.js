
const formatPercentage = (value, total) => {
    let tempValue;
    if (total && value) {
        tempValue = (value / total) * 100;
    } else {
        tempValue = 0;
    }
    return `${tempValue.toFixed(1)}%`;
};

export default formatPercentage;
