import React, { FC, SyntheticEvent, useCallback, useState } from 'react';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import TuneIcon from '@mui/icons-material/Tune';
import { Box, Tab, Tabs } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../messages';
import { InfoTab } from './InfoTab';
import { LevelsAndTeamsTab } from './LevelsAndTeamsTab';
import { PlanningHeader } from './PlanningHeader';

const styles = {
    root: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
    },
    tabs: {
        marginBottom: 3,
    },
} satisfies SxStyles;

type TabKey = 'info' | 'levelsAndTeams';

export const PlanningDetails: FC = () => {
    const { formatMessage } = useSafeIntl();
    const [activeTab, setActiveTab] = useState<TabKey>('info');
    const handleChangeTab = useCallback(
        (_event: SyntheticEvent, tab: TabKey) => setActiveTab(tab),
        [],
    );

    return (
        <Box sx={styles.root}>
            <PlanningHeader />
            <Tabs value={activeTab} onChange={handleChangeTab} sx={styles.tabs}>
                <Tab
                    value="info"
                    label={formatMessage(MESSAGES.info)}
                    icon={<TuneIcon />}
                    iconPosition="start"
                />
                <Tab
                    value="levelsAndTeams"
                    label={formatMessage(MESSAGES.levelsAndTeams)}
                    icon={<AccountTreeOutlinedIcon />}
                    iconPosition="start"
                />
            </Tabs>
            {activeTab === 'info' && <InfoTab />}
            {activeTab === 'levelsAndTeams' && <LevelsAndTeamsTab />}
        </Box>
    );
};
