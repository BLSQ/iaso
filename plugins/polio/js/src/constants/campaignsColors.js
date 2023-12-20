import {
    pink,
    purple,
    indigo,
    blue,
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

const colors = [
    teal[800],
    lightGreen[800],
    purple[800],
    blue[800],
    amber[800],
    lime[800],
    brown[800],
    grey[800],
    cyan[800],
    blueGrey[800],
    pink[800],
    indigo[800],
    yellow[800],
    deepOrange[800],
];

const getCampaignColor = (i, reverse = false) => {
    const allColors = reverse ? colors.reverse() : colors;
    return allColors[i % allColors.length];
};

export { getCampaignColor };
