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
        if (embedded) {
            return styles.embedded;
        }
        if (navHasTabs) {
            return styles.standaloneTabbed;
        }

        return styles.standalone;
    }, [embedded, navHasTabs]);

    return (
        <Box
            sx={{
                ...styles.base,
                ...(Array.isArray(wrapperStyle)
                    ? wrapperStyle
                    : [wrapperStyle]),
                ...(Array.isArray(sx) ? sx : [sx]),
            }}
        >
            {children}
        </Box>
    );
};
