export const chipColors = [
    '#4dd0e1',
    '#01579b',
    '#607d8b',
    '#ff7043',
    '#e91e63',
    '#9c27b0',
    '#f44336',
    '#2196f3',
    '#009688',
];

export const getChipColors = (i, reverse = false) => {
    const colors = reverse ? chipColors.reverse() : chipColors;
    return colors[i % colors.length];
};

export const otChipColors = [
    '#e91e63',
    '#795548',
    '#0277BD',
    '#4CAF50',
    '#607d8b',
    '#ff7043',
    '#01579b',
    '#9E9D24',
    '#9c27b0',
];
export const getOtChipColors = i => otChipColors[i % otChipColors.length];
