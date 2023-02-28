import React from 'react';

import { withStyles } from '@material-ui/core';

import PropTypes from 'prop-types';
import Star from './StarSvgComponent';

export const styles = theme => ({
    stars: {
        width: 100,
        height: 18,
        position: 'relative',
    },
    starsBar: {
        backgroundColor: '#F3D110',
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        width: 100,
    },
    starsImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: 18,
        width: 100,
    },
    score: {
        marginLeft: theme.spacing(1),
        fontSize: '0.6rem',
        color: 'rgba(0, 0, 0, 0.6)',
        position: 'relative',
        top: 3,
    },
});

function StarsComponent(props) {
    const { score, classes, starsCount, bgColor, displayCount } = props;
    const stars = [];
    for (let i = 0; i < starsCount; i += 1) {
        stars.push(<Star key={i} starBgColor={bgColor} />);
    }
    return (
        <>
            <div className={classes.stars}>
                <div
                    style={{
                        width: `${score}%`,
                    }}
                    className={classes.starsBar}
                />
                <div className={classes.starsImage}>{stars}</div>
            </div>
            {displayCount && (
                <span className={classes.score}>{`(${score}/100)`}</span>
            )}
        </>
    );
}
StarsComponent.defaultProps = {
    score: 0,
    starsCount: 5,
    bgColor: 'white',
    displayCount: true,
};

StarsComponent.propTypes = {
    score: PropTypes.number,
    classes: PropTypes.object.isRequired,
    starsCount: PropTypes.number,
    bgColor: PropTypes.string,
    displayCount: PropTypes.bool,
};

export default withStyles(styles)(StarsComponent);
