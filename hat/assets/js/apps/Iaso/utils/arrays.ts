export const updateArrayAtIndex = (
    index: number,
    value: any,
    array?: any[],
) => {
    const currentArray = [...(array || [])];
    const updatedArray = [...currentArray];
    updatedArray[index] = value;
    return updatedArray;
};

export const addToArray = (value: any, array?: any[]) => {
    const currentArray = [...(array || [])];
    return [...currentArray, value];
};

export const removeFromArray = (index: number, array?: any[]) => {
    const currentArray = [...(array || [])];
    return currentArray.filter((_, i) => i !== index);
};
