import React, { FunctionComponent, useContext, useMemo } from 'react';
import { Box, Theme } from '@mui/material';

import { ThemeConfigContext } from '../contexts/ThemeConfigContext';
import { LogoSvg } from './LogoSvg';
import { Logo } from './Logo';

const styles = {
    text: {
        fontFamily: '"DINAlternate-Bold", "DIN Alternate", sans-serif',
        fontSize: 23,
    },
};

export const LogoAndTitle: FunctionComponent = () => {
    const { LOGO_PATH, APP_TITLE, SHOW_NAME_WITH_LOGO } =
        useContext(ThemeConfigContext);
    const showAppName = SHOW_NAME_WITH_LOGO === 'yes';

    const isIaso = APP_TITLE === 'Iaso';
    const hasLogo = isIaso || LOGO_PATH;

    return (
        <>
            {hasLogo && <Logo isIaso={isIaso} logoPath={LOGO_PATH} />}
            {showAppName && (
                <Box
                    component="span"
                    sx={(theme: Theme) => ({
                        ...styles.text,
                        marginLeft: hasLogo ? theme.spacing(2) : 0,
                    })}
                >
                    {APP_TITLE}
                </Box>
            )}
        </>
    );
};
