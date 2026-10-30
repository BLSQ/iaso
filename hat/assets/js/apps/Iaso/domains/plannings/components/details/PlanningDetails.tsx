import React, { FC, SyntheticEvent, useCallback } from 'react';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import TuneIcon from '@mui/icons-material/Tune';
import { Tab, Tabs } from '@mui/material';
import { useRedirectToReplace, useSafeIntl } from 'bluesquare-components';
import { GreyPageWrapper } from 'Iaso/components/GreyPageWrapper';
import { baseUrls } from 'Iaso/constants/urls';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { smallTabsOverrides } from 'Iaso/styles';
import { SxStyles } from 'Iaso/types/general';
import { usePlanningContext } from '../../contexts/PlanningContext';
import MESSAGES from '../../messages';
import { InfoTab } from '../info/InfoTab';
import { LevelsAndTeamsTab } from '../levelsAndTeams/LevelsAndTeamsTab';
import { DeprecatedPlanningWarning } from './DeprecatedPlanningWarning';
import { PlanningHeaderActions, PlanningHeaderTitle } from './PlanningHeader';

const styles = {
    tabs: {
        ...smallTabsOverrides,
        flexShrink: 0,
        marginBottom: 3,
    },
} satisfies SxStyles;

type TabKey = 'info' | 'levelsAndTeams';

const TAB_KEYS: TabKey[] = ['info', 'levelsAndTeams'];

const isTabKey = (tab?: string): tab is TabKey =>
    TAB_KEYS.includes(tab as TabKey);

export const PlanningDetails: FC = () => {
    const { formatMessage } = useSafeIntl();
    const { isReadOnly } = usePlanningContext();
    const params = useParamsObject(baseUrls.planningDetails);
    const activeTab: TabKey = isTabKey(params.tab) ? params.tab : 'info';
    const redirectToReplace = useRedirectToReplace();
    const handleChangeTab = useCallback(
        (_event: SyntheticEvent, tab: TabKey) =>
            redirectToReplace(baseUrls.planningDetails, { ...params, tab }),
        [redirectToReplace, params],
    );

    return (
        <GreyPageWrapper
            title={<PlanningHeaderTitle />}
            actions={<PlanningHeaderActions />}
        >
            {isReadOnly && <DeprecatedPlanningWarning />}
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
