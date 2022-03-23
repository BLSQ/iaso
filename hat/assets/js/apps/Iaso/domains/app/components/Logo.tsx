import React, { FunctionComponent, useContext } from 'react';
import { makeStyles, Theme } from '@material-ui/core';
import { LogoSvg } from './LogoSvg';
import { ThemeConfigContext } from '../contexts/ThemeConfigContext';

const useStyles = makeStyles((theme: Theme) => ({
    text: {
        fontFamily: '"DINAlternate-Bold", "DIN Alternate", sans-serif',
        fontSize: 23,
        marginLeft: theme.spacing(2),
    },
}));

export const Logo: FunctionComponent = () => {
    const { LOGO_PATH, APP_TITLE } = useContext(ThemeConfigContext);
    const classes = useStyles();
    // @ts-ignore
    const staticUrl = window.STATIC_URL ?? '/static/';
    if (LOGO_PATH) {
        return (
            <>
                <img alt="logo" src={`${staticUrl}${LOGO_PATH}`} />
                <span className={classes.text}>{APP_TITLE}</span>
            </>
        );
    }
    return (
        <>
            <LogoSvg />
            <span className={classes.text}>Iaso</span>
        </>
    );
};
