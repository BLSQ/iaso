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
    teal[500],
    orange[700],
    lightGreen[800],
    purple[500],
    amber[500],
    lightBlue[500],
    red[900],
    lime[900],
    blueGrey[500],
    grey[900],
    pink[500],
    green[800],
    indigo[500],
    deepPurple[800],
    yellow[700],
    deepOrange[700],
    blue[500],
    cyan[500],
    brown[500],
];

export const getColor = (i: number, reverse = false): string => {
    const allColors = reverse ? colors.reverse() : colors;
    return allColors[i % allColors.length];
};

export const disabledColor = grey[400];
export const unSelectedColor = grey[600];
export const parentColor = pink[300];
