import React, { FunctionComponent } from 'react';
import { Tabs, Box } from '@mui/material';
import { SxStyles } from 'Iaso/types/general';
import { Campaign } from '../../../constants/types';
import { useStyles } from '../../../styles/theme';
import { CampaignHistoryIconButton } from '../CampaignHistory/CampaignHistoryIconButton';
import { PolioDialogTab } from './PolioDialogTab';

export type Tab = {
    title: string;
    form: FunctionComponent;
    hasTabError: boolean;
    key: string;
    disabled?: boolean;
    disabledMessage?: string;
};

const styles: SxStyles = {
    root: {
        position: 'relative',
    },
    tabs: {
        width: 'calc(100% - 46px)',
    },
    historyIconButton: {
        position: 'absolute',
        top: 0,
        right: 0,
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: theme => `1px solid ${theme.palette.divider}`,
    },
};

type Props = {
    selectedTab: number;
    handleChange: (_event: any, newValue: number) => void;
    tabs: Tab[];
    selectedCampaign: Campaign;
};

export const PolioDialogTabs: FunctionComponent<Props> = ({
    selectedTab,
    handleChange,
    tabs,
    selectedCampaign,
}) => {
    const classes: Record<string, string> = useStyles();

    return (
        <Box sx={styles.root}>
            <Box sx={styles.tabs}>
                <Tabs
                    value={selectedTab}
                    className={classes.tabs}
                    textColor="primary"
                    aria-label="disabled tabs example"
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    {tabs.map(
                        (
                            {
                                title,
                                disabled = false,
                                hasTabError = false,
                                key,
                                disabledMessage,
                            },
                            index,
                        ) => (
                            <PolioDialogTab
                                key={key}
                                title={title}
                                disabled={disabled}
                                hasTabError={hasTabError}
                                handleChange={handleChange}
                                value={index}
                                disabledMessage={disabledMessage}
                            />
                        ),
                    )}
                </Tabs>
            </Box>
            <Box sx={styles.historyIconButton}>
                <CampaignHistoryIconButton
                    selectedCampaign={selectedCampaign}
                />
            </Box>
        </Box>
    );
};
