import React, { FunctionComponent } from 'react';
import StarFull from '@mui/icons-material/Star';
import StarOutlined from '@mui/icons-material/StarBorderOutlined';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles({
    star: {
        color: '#F3D110',
        position: 'relative',
        top: 3,
        margin: '0 -2px',
    },
});
type Props = {
    score: number;
    starsCount?: number;
};
const FullStarsSvg: FunctionComponent<Props> = ({ score, starsCount = 5 }) => {
    const classes = useStyles();
    const stars: any[] = [];

    for (let i = 0; i < score; i += 1) {
        stars.push(<StarFull className={classes.star} key={`${i}-pos`} />);
    }
    for (let i = 0; i < starsCount - score; i += 1) {
        stars.push(<StarOutlined className={classes.star} key={`${i}-neg`} />);
    }
    return stars;
};

export default FullStarsSvg;
