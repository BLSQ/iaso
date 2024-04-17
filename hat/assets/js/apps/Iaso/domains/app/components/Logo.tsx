import React, { FunctionComponent, useContext } from 'react';
import { Theme } from '@mui/material';

import { makeStyles } from '@mui/styles';
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
    const { LOGO_PATH, APP_TITLE, SHOW_NAME_WITH_LOGO } =
        useContext(ThemeConfigContext);
    const classes = useStyles();
    const showAppName = SHOW_NAME_WITH_LOGO === 'yes';
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
