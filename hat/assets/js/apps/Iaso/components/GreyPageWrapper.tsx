import React, { FC, ReactNode, useMemo } from 'react';
import { Box, Breakpoint, Theme, Typography } from '@mui/material';
import { SystemStyleObject } from '@mui/system';
import { MENU_HEIGHT_WITHOUT_TABS } from 'Iaso/constants/uiConstants';
import { SxStyles } from 'Iaso/types/general';
import { MainWrapper } from './MainWrapper';

const HEADER_HEIGHT = '80px';

const styles = {
    root: {
        backgroundColor: theme => theme.palette.primary.background,
        padding: 0,
    },
    headerContainer: {
        borderBottom: theme => `1px solid ${theme.palette.divider}`,
        backgroundColor: 'white',
        height: HEADER_HEIGHT,
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '100%',
    },
    title: {
        display: 'flex',
        alignItems: 'center',
        gap: 2,
    },
    bodyContainer: {
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        height: `calc(100vh - ${MENU_HEIGHT_WITHOUT_TABS}px - ${HEADER_HEIGHT})`,
        overflow: 'auto',
        py: 4,
    },
    body: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
    },
} satisfies SxStyles;

const getContentWidthStyle = (
    maxWidth?: Breakpoint,
): SystemStyleObject<Theme> =>
    maxWidth
        ? {
              width: '100%',
              boxSizing: 'border-box',
              maxWidth: (theme: Theme) => theme.breakpoints.values[maxWidth],
              mx: 'auto',
              px: { xs: 2, md: 0 },
          }
        : { width: '100%', boxSizing: 'border-box', px: 4 };

type Props = {
    title: ReactNode;
    actions?: ReactNode;
    maxWidth?: Breakpoint;
    children: ReactNode;
};

export const GreyPageWrapper: FC<Props> = ({
    title,
    actions,
    maxWidth,
    children,
}) => {
    const { header, body } = useMemo(() => {
        const contentWidthStyle = getContentWidthStyle(maxWidth);
        return {
            header: { ...styles.header, ...contentWidthStyle },
            body: { ...styles.body, ...contentWidthStyle },
        };
    }, [maxWidth]);
    return (
        <MainWrapper sx={styles.root}>
            <Box sx={styles.headerContainer}>
                <Box sx={header}>
                    <Typography variant="h6" component="div" sx={styles.title}>
                        {title}
                    </Typography>
                    <Box>{actions}</Box>
                </Box>
            </Box>
            <Box sx={styles.bodyContainer}>
                <Box sx={body}>{children}</Box>
            </Box>
        </MainWrapper>
    );
};
