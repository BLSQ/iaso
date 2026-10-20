import React, { FC, SyntheticEvent, useCallback, useState } from 'react';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import TuneIcon from '@mui/icons-material/Tune';
import { Tab, Tabs } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { GreyPageWrapper } from 'Iaso/components/GreyPageWrapper';
import { smallTabsOverrides } from 'Iaso/styles';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../../messages';
import { InfoTab } from '../info/InfoTab';
import { LevelsAndTeamsTab } from '../levelsAndTeams/LevelsAndTeamsTab';
import { PlanningHeaderActions, PlanningHeaderTitle } from './PlanningHeader';

const styles = {
    tabs: {
        ...smallTabsOverrides,
        flexShrink: 0,
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
        <GreyPageWrapper
            title={<PlanningHeaderTitle />}
            actions={<PlanningHeaderActions />}
        >
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
        </GreyPageWrapper>
    );
};
