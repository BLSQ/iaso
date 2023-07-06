import { makeStyles } from '@material-ui/core';
import React, { FunctionComponent, ReactElement } from 'react';
import Star from './StarSvgComponent';

const useStyles = makeStyles(theme => ({
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
}));

export const starsStyleForTable = {
    table: {
        '& tr:nth-of-type(odd) .bg-star path': {
            fill: '#f7f7f7 !important',
        },
    },
};

type Props = {
    fullStars?: number;
    score?: number;
    maxScore?: number;
    starCount?: number;
    displayCount?: boolean;
};

const getFullStarsRatio = ({ fullStars, score, starCount, maxScore }) => {
    if (fullStars) {
        return Math.round((100 * fullStars) / starCount);
    }
    if (score !== null && score !== undefined) {
        return Math.round((100 * score) / maxScore);
    }
    console.error(
        `Expected a value for fullStars or score, got ${fullStars} and ${score} `,
    );
    return 0;
};

export const StarsComponent: FunctionComponent<Props> = ({
    fullStars,
    score,
    maxScore = 1000,
    starCount = 5,
    displayCount = false,
}) => {
    const classes = useStyles();
    const stars: ReactElement[] = [];
    const fullStarsRatio = getFullStarsRatio({
        fullStars,
        score,
        maxScore,
        starCount,
    });
    for (let i = 1; i <= starCount; i += 1) {
        stars.push(<Star key={i} />);
    }
    return (
        <>
            <div className={classes.stars}>
                <div
                    style={{
                        width: `${fullStarsRatio}%`,
                    }}
                    data-test="star-value"
                    className={classes.starsBar}
                />
                <div className={classes.starsImage}>{stars}</div>
            </div>
            {score && displayCount && (
                <span className={classes.score}>
                    {`(${score}/${maxScore})`}
                </span>
            )}
        </>
    );
};
