import {
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
    blueGrey,
} from '@material-ui/core/colors';

export const colors = [
    teal[500],
    lightGreen[800],
    purple[800],
    blue[500],
    amber[500],
    lightBlue[500],
    lime[500],
    brown[500],
    cyan[500],
    blueGrey[500],
    pink[500],
    indigo[500],
    yellow[500],
    deepOrange[700],
];

export const getColor = (i: number, reverse = false): string => {
    const allColors = reverse ? colors.reverse() : colors;
    return allColors[i % allColors.length];
};
