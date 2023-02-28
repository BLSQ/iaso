import { makeStyles } from '@material-ui/core';
import React, { FunctionComponent, ReactElement } from 'react';
import { styles } from '../../../components/stars/StarsComponent';
import Star from '../../../components/stars/StarSvgComponent';

// @ts-ignore
const useStyles = makeStyles(styles);

type Props = {
    fullStars: number;
    score?: number;
    maxScore?: number;
    starCount?: number;
    starBgColor?: string;
};

export const DuplicatesStars: FunctionComponent<Props> = ({
    fullStars,
    score,
    maxScore = 1000,
    starCount = 5,
    starBgColor = 'white',
}) => {
    const classes = useStyles();
    const stars: ReactElement[] = [];
    const fullStarsRatio = (100 * fullStars) / starCount;
    for (let i = 1; i <= starCount; i += 1) {
        stars.push(<Star key={i} starBgColor={starBgColor} />);
    }
    return (
        <>
            <div className={classes.stars}>
                <div
                    style={{
                        width: `${fullStarsRatio}%`,
                    }}
                    className={classes.starsBar}
                />
                <div className={classes.starsImage}>{stars}</div>
            </div>
            {score && (
                <span className={classes.score}>
                    {`(${score}/${maxScore})`}
                </span>
            )}
        </>
    );
};
