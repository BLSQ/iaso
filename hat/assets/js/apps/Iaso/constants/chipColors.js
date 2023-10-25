import {
    red,
    pink,
    purple,
    indigo,
    blue,
    lightBlue,
    cyan,
    teal,
    lightGreen,
    lime,
    yellow,
    amber,
    deepOrange,
    brown,
    grey,
    blueGrey,
} from '@mui/material/colors';

export const chipColors = [
    deepOrange[600],
    blue[400],
    amber[400],
    lightBlue[400],
    lime[400],
    brown[400],
    blueGrey[400],
    teal[400],
    grey[400],
    cyan[400],
    pink[400],
    indigo[400],
    red[400],
    lightGreen[700],
    purple[700],
    yellow[700],
];

export const getChipColors = (i, reverse = false, usedColors = []) => {
    let colors = reverse ? chipColors.reverse() : chipColors;
    colors = colors.filter(color => !usedColors.includes(color));
    return colors[i % colors.length];
};

export const otChipColors = [
    red[600],
    teal[600],
    lightGreen[900],
    purple[900],
    blue[600],
    amber[600],
    lightBlue[600],
    lime[600],
    brown[600],
    grey[600],
    cyan[600],
    blueGrey[600],
    pink[600],
    indigo[600],
    yellow[900],
    deepOrange[800],
];
export const getOtChipColors = i => otChipColors[i % otChipColors.length];
