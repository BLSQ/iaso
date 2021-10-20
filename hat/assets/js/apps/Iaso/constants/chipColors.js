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
} from '@material-ui/core/colors';

export const chipColors = [
    deepOrange[700],
    blue[500],
    amber[500],
    lightBlue[500],
    lime[500],
    brown[500],
    blueGrey[500],
    teal[500],
    grey[500],
    cyan[500],
    pink[500],
    indigo[500],
    red[500],
    lightGreen[800],
    purple[800],
    yellow[800],
];

export const getChipColors = (i, reverse = false) => {
    const colors = reverse ? chipColors.reverse() : chipColors;
    return colors[i % colors.length];
};

export const otChipColors = [
    red[500],
    teal[500],
    lightGreen[800],
    purple[800],
    blue[500],
    amber[500],
    lightBlue[500],
    lime[500],
    brown[500],
    grey[500],
    cyan[500],
    blueGrey[500],
    pink[500],
    indigo[500],
    yellow[800],
    deepOrange[700],
];
export const getOtChipColors = i => otChipColors[i % otChipColors.length];
