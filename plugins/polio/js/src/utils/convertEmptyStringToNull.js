const convertEmptyStringToNull = values => {
    const converted = {...values};
    const keys = Object.keys(values);
    keys.forEach(key => {
        if (values[key]===""){
            converted[key]=null;
        }
    })
    return converted;
}

export {convertEmptyStringToNull};