import React, { FC, useCallback, useEffect, useRef } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { Button, IconButton, Stack } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SnackbarKey, useSnackbar } from 'notistack';
import { openSnackBar } from 'Iaso/components/snackBars/EventDispatcher';
import { SxStyles } from 'Iaso/types/general';
import {
    getFieldsToFix,
    PLANNING_TABS,
    TabKey,
    useSelectPlanningTab,
} from '../components/details/planningTabs';
import MESSAGES from '../messages';
import { PlanningFormik } from './usePlanningForm';

const styles = {
    tabButton: {
        fontWeight: 'bold',
        textDecoration: 'underline',
    },
} satisfies SxStyles;

type TabButtonProps = {
    tab: TabKey;
    label: string;
    fieldsToFix: string[];
    onSelectTab: (tab: TabKey) => void;
};

const TabButton: FC<TabButtonProps> = ({
    tab,
    label,
    fieldsToFix,
    onSelectTab,
}) => {
    const handleClick = useCallback(() => onSelectTab(tab), [onSelectTab, tab]);
    return (
        <Button
            size="small"
            color="inherit"
            title={fieldsToFix.join(', ')}
            onClick={handleClick}
            sx={styles.tabButton}
        >
            {label}
        </Button>
    );
};

type MissingFieldsSnackBar = {
    openMissingFieldsSnackBar: (errors: PlanningFormik['errors']) => void;
    closeMissingFieldsSnackBar: () => void;
};

export const useMissingFieldsSnackBar = (): MissingFieldsSnackBar => {
    const { formatMessage } = useSafeIntl();
    const { closeSnackbar } = useSnackbar();
    const snackBarKey = useRef<SnackbarKey>();
    const closeMissingFieldsSnackBar = useCallback(() => {
        if (snackBarKey.current) closeSnackbar(snackBarKey.current);
    }, [closeSnackbar]);
    useEffect(() => closeMissingFieldsSnackBar, [closeMissingFieldsSnackBar]);
    const selectTab = useSelectPlanningTab();
    const openMissingFieldsSnackBar = useCallback(
        (errors: PlanningFormik['errors']) => {
            const tabsToFix = PLANNING_TABS.map(tab => ({
                ...tab,
                fieldsToFix: getFieldsToFix(tab, errors, formatMessage),
            })).filter(({ fieldsToFix }) => fieldsToFix.length > 0);
            // Replaced on every failed save so it never lists outdated tabs.
            closeMissingFieldsSnackBar();
            snackBarKey.current = `planningMissingFields-${Date.now()}`;
            openSnackBar({
                messageObject: formatMessage(MESSAGES.cantSaveFieldsToFix),
                id: snackBarKey.current,
                options: {
                    variant: 'error',
                    persist: true,
                    action: (
                        <Stack direction="row" alignItems="center">
                            {tabsToFix.map(({ key, label, fieldsToFix }) => (
                                <TabButton
                                    key={key}
                                    tab={key}
                                    label={formatMessage(label)}
                                    fieldsToFix={fieldsToFix}
                                    onSelectTab={selectTab}
                                />
                            ))}
                            <IconButton
                                size="small"
                                color="inherit"
                                aria-label={formatMessage(MESSAGES.close)}
                                onClick={closeMissingFieldsSnackBar}
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Stack>
                    ),
                },
            });
        },
        [formatMessage, selectTab, closeMissingFieldsSnackBar],
    );
    return { openMissingFieldsSnackBar, closeMissingFieldsSnackBar };
};
