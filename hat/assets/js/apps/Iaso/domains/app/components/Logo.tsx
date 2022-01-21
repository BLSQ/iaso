import React, { FunctionComponent } from 'react';
import { makeStyles, Theme } from '@material-ui/core';
import LogoSvg from './LogoSvgComponent';

const useStyles = makeStyles((theme: Theme) => ({
    text: {
        fontFamily: '"DINAlternate-Bold", "DIN Alternate", sans-serif',
        fontSize: 23,
        marginLeft: theme.spacing(2),
    },
}));

export const Logo: FunctionComponent = () => {
    const classes = useStyles();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const staticUrl = window.STATIC_URL ?? '/static/';
    if (process.env.REACT_LOGO_PATH) {
        return (
            <>
                <img
                    alt="logo"
                    src={`${staticUrl}${process.env.REACT_LOGO_PATH}`}
                />
                <span className={classes.text}>
                    {process.env.REACT_APP_TITLE}
                </span>
            </>
        );
    }
    return <LogoSvg />;
};
