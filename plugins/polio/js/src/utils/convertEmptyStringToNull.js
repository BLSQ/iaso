const convertEmptyStringToNull = values => {
    const converted = { ...values };
    const keys = Object.keys(values);
    keys.forEach(key => {
        if (values[key] === '') {
            converted[key] = null;
        }
        if (key.includes('round_') && values[key]) {
            converted[key] = convertEmptyStringToNull(values[key]);
        }
    });
    return converted;
};

export { convertEmptyStringToNull };
