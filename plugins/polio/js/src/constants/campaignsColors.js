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

const colors = [
    red[500],
    teal[500],
    lightGreen[500],
    purple[500],
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
    yellow[500],
    deepOrange[500],
];

const getCampaignColor = (i, reverse = false) => {
    const allColors = reverse ? colors.reverse() : colors;
    return allColors[i % allColors.length];
};

export { getCampaignColor };
