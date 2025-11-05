import {
    amber,
    blue,
    blueGrey,
    brown,
    cyan,
    deepOrange,
    grey,
    indigo,
    lightBlue,
    lightGreen,
    lime,
    pink,
    purple,
    red,
    teal,
    yellow,
} from '@mui/material/colors';

export const chipColors = [
    deepOrange[600], // #f4511e
    blue[400], // #42a5f5
    amber[400], // #ffca28
    lightBlue[400], // #29b6f6
    lime[400], // #d4e157
    brown[400], // #8d6e63
    blueGrey[400], // #78909c
    teal[400], // #26a69a
    grey[400], // #bdbdbd
    cyan[400], // #26c6da
    pink[400], // #ec407a
    indigo[400], // #5c6bc0
    red[400], // #ef5350
    lightGreen[700], // #689f38
    purple[700], // #7b1fa2
    yellow[700], // #fbc02d
];

export const getChipColors = (i, reverse = false, usedColors = []) => {
    let colors = reverse ? chipColors.reverse() : chipColors;
    colors = colors.filter(color => !usedColors.includes(color));
    return colors[i % colors.length];
};

export const otChipColors = [
    teal[600], // #00897b
    lightGreen[900], // #33691e
    purple[900], // #4a148c
    blue[600], // #1e88e5
    amber[600], // #ffb300
    lightBlue[600], // #039be5
    lime[600], // #c0ca33
    brown[600], // #6d4c41
    grey[600], // #757575
    cyan[600], // #00acc1
    blueGrey[600], // #546e7a
    pink[600], // #d81b60
    indigo[600], // #3949ab
    yellow[900], // #f57f17
    deepOrange[800], // #d84315
];
export const getOtChipColors = i => otChipColors[i % otChipColors.length];
