import React, { FC, useMemo } from 'react';
import { SxProps } from '@mui/material';
import { Box, Theme } from '@mui/system';
import {
    MENU_HEIGHT_WITH_TABS,
    MENU_HEIGHT_WITHOUT_TABS,
} from 'Iaso/constants/uiConstants';
import { SxStyles } from 'Iaso/types/general';

type MainWrapperProps = {
    sx?: SxProps<Theme>;
    embedded?: boolean;
    navHasTabs?: boolean;
    children?: React.ReactNode;
};

const styles: SxStyles = {
    base: {
        overflow: 'auto',
        paddingBottom: 4,
        backgroundColor: 'white',
        position: 'relative',
    },
    embedded: {
        height: '100vh',
    },
    standalone: {
        height: `calc(100vh - ${MENU_HEIGHT_WITHOUT_TABS}px)`,
    },
    standaloneTabbed: {
        height: `calc(100vh - ${MENU_HEIGHT_WITH_TABS}px)`,
    },
};

export const MainWrapper: FC<MainWrapperProps> = ({
    sx,
    children,
    navHasTabs = false,
    embedded = false,
}) => {
    const wrapperStyle = useMemo(() => {
        let style = styles.standalone;
        if (embedded) {
            style = styles.embedded;
        }
        if (navHasTabs) {
            style = styles.standaloneTabbed;
        }

        return {
            ...styles.base,
            ...style,
            ...sx,
        };
    }, [embedded, navHasTabs, sx]);
    return <Box sx={wrapperStyle}>{children}</Box>;
};
