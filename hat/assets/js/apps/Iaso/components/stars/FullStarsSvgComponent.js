import React from 'react';
import PropTypes from 'prop-types';

import { withStyles } from '@mui/styles';
import StarFull from '@mui/icons-material/Star';
import StarOutlined from '@mui/icons-material/StarBorderOutlined';

const styles = () => ({
    star: {
        color: '#F3D110',
        position: 'relative',
        top: 3,
        margin: '0 -2px',
    },
});

function FullStarsSvg(props) {
    const { classes, score, starsCount } = props;
    const stars = [];

    for (let i = 0; i < score; i += 1) {
        stars.push(<StarFull className={classes.star} key={`${i}-pos`} />);
    }
    for (let i = 0; i < starsCount - score; i += 1) {
        stars.push(<StarOutlined className={classes.star} key={`${i}-neg`} />);
    }
    return stars;
}

FullStarsSvg.defaultProps = {
    starsCount: 5,
};

FullStarsSvg.propTypes = {
    classes: PropTypes.object.isRequired,
    score: PropTypes.number.isRequired,
    starsCount: PropTypes.number,
};

export default withStyles(styles)(FullStarsSvg);
