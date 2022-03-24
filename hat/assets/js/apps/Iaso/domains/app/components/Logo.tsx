import React, { FunctionComponent, useContext } from 'react';
import { Box, makeStyles, Theme } from '@material-ui/core';
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
    const { LOGO_PATH, APP_TITLE, SHOW_LOGO_WITH_NAME } =
        useContext(ThemeConfigContext);
    const classes = useStyles();
    const showAppName = SHOW_LOGO_WITH_NAME === 'yes';
    // @ts-ignore
    const staticUrl = window.STATIC_URL ?? '/static/';
    if (LOGO_PATH && APP_TITLE !== 'Iaso') {
        return (
            <>
                <img
                    alt="logo"
                    src={`${staticUrl}${LOGO_PATH}`}
                    style={{ maxHeight: '50px', maxWidth: '200px' }}
                />
                {showAppName && (
                    <span className={classes.text}>{APP_TITLE}</span>
                )}
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
