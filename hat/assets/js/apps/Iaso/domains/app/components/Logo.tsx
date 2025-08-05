import React, { FunctionComponent, useContext } from 'react';
import { Box, Theme } from '@mui/material';

import { ThemeConfigContext } from '../contexts/ThemeConfigContext';
import { LogoSvg } from './LogoSvg';

const styles = {
    text: {
        fontFamily: '"DINAlternate-Bold", "DIN Alternate", sans-serif',
        fontSize: 23,
    },
};

export const Logo: FunctionComponent = () => {
    const { LOGO_PATH, APP_TITLE, SHOW_NAME_WITH_LOGO } =
        useContext(ThemeConfigContext);
    const showAppName = SHOW_NAME_WITH_LOGO === 'yes';

    let logoComponent: React.ReactNode = null;
    if (APP_TITLE === 'Iaso') {
        logoComponent = <LogoSvg />;
    } else if (LOGO_PATH) {
        logoComponent = (
            <img
                alt="logo"
                src={`${window.STATIC_URL}${LOGO_PATH}`}
                style={{ maxHeight: '50px', maxWidth: '200px' }}
            />
        );
    }

    return (
        <>
            {logoComponent}
            {showAppName && (
                <Box
                    component="span"
                    sx={(theme: Theme) => ({
                        ...styles.text,
                        marginLeft: logoComponent ? theme.spacing(2) : 0,
                    })}
                >
                    {APP_TITLE}
                </Box>
            )}
        </>
    );
};
