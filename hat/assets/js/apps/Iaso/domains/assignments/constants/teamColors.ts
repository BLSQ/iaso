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

export const teamsColors = [
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

export const getTeamColor = (i: number, reverse = false): string => {
    const allColors = reverse ? teamsColors.reverse() : teamsColors;
    return allColors[i % allColors.length];
};
