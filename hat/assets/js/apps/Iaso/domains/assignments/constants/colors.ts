import {
    red,
    pink,
    purple,
    deepPurple,
    indigo,
    blue,
    lightBlue,
    cyan,
    teal,
    lightGreen,
    green,
    lime,
    yellow,
    amber,
    deepOrange,
    orange,
    brown,
    blueGrey,
    grey,
} from '@mui/material/colors';

export const colors = [
    // Reds
    red[500], // #f44336
    red[900], // #b71c1c
    // Pinks
    pink[300], // #f06292 (flashy)
    pink[500], // #e91e63
    pink[700], // #c2185b
    // Purples
    purple[500], // #9c27b0
    purple[800], // #6a1b9a
    deepPurple[800], // #4527a0
    // Indigos
    indigo[500], // #3f51b5
    // Blues
    lightBlue[500], // #03a9f4
    lightBlue[800], // #0277bd
    blue[800], // #1565c0
    // Cyans
    cyan[500], // #00bcd4
    cyan[800], // #00838f
    // Teals
    teal[500], // #009688
    teal[800], // #00695c
    // Greens
    green[500], // #4caf50
    green[800], // #2e7d32
    lightGreen[800], // #558b2f
    // Limes
    lime[500], // #cddc39
    lime[900], // #827717
    // Yellows
    yellow[500], // #ffeb3b
    // Ambers
    amber[500], // #ffc107
    amber[800], // #ff8f00
    // Oranges
    orange[500], // #ff9800
    orange[700], // #f57c00
    deepOrange[500], // #ff5722
    deepOrange[700], // #e64a19
    // Browns
    brown[500], // #795548
    brown[700], // #5d4037
    // Neutrals
    blueGrey[500], // #607d8b
    blueGrey[800], // #37474f
    grey[800], // #212121
    '#000000', // black
];

export const getColor = (i: number, reverse = false): string => {
    const allColors = reverse ? colors.reverse() : colors;
    return allColors[i % allColors.length];
};

export const disabledColor = grey[400];
export const unSelectedColor = grey[600];
export const parentColor = pink[300];
