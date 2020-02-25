export const getPrettyPeriod = (period) => {
    if (period.length === 4) {
        return period;
    }
    const year = period.substring(0, 4);
    const prefix = period.substring(4, 6);
    return `${prefix}-${year}`;
};

export default getPrettyPeriod;
