import React, { FC } from 'react';
import { SxProps } from '@mui/material';
import { Box } from '@mui/system';
import { MENU_HEIGHT_WITHOUT_TABS } from 'Iaso/constants/uiConstants';

type MainWrapperProps = {
    sx?: SxProps;
    embedded?: boolean;
    children?: React.ReactNode;
};

const styles = {
    base: {
        overflow: 'auto',
        paddingBottom: 4,
    },
    embedded: {
        height: '100vh',
    },
    standalone: {
        height: `calc(100vh - ${MENU_HEIGHT_WITHOUT_TABS}px)`,
    },
};

export const MainWrapper: FC<MainWrapperProps> = ({
    sx,
    children,
    embedded = false,
}) => {
    return (
        <Box
            sx={{
                ...styles.base,
                ...(embedded ? styles.embedded : styles.standalone),
                ...sx,
            }}
        >
            {children}
        </Box>
    );
};
