import React, { FC, useCallback } from 'react';
import { Box } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { MENU_HEIGHT_WITHOUT_TABS } from 'Iaso/constants/uiConstants';
import { SxStyles } from 'Iaso/types/general';
import { WorkInProgress } from './WorkInProgress';

const styles = {
    body: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: `calc(100vh - ${MENU_HEIGHT_WITHOUT_TABS}px)`,
    },
} satisfies SxStyles;

export type WorkInProgressLocationState = {
    plannedRelease?: string;
};

// Replace navigations (e.g. the accountId redirect) keep the router's history index at 0
const hasInAppHistory = (): boolean => (window.history.state?.idx ?? 0) > 0;

export const PageWorkInProgress: FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { plannedRelease } = (location.state ??
        {}) as WorkInProgressLocationState;

    const handleBack = useCallback(() => {
        if (hasInAppHistory()) {
            navigate(-1);
        } else {
            navigate('/');
        }
    }, [navigate]);

    return (
        <>
            <TopBar displayBackButton={false} />
            <Box sx={styles.body}>
                <WorkInProgress
                    plannedRelease={plannedRelease}
                    onBack={handleBack}
                />
            </Box>
        </>
    );
};
