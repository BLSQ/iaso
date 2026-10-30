import React, { FC, SyntheticEvent, useCallback } from 'react';
import { Tab, Tabs } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { GreyPageWrapper } from 'Iaso/components/GreyPageWrapper';
import { baseUrls } from 'Iaso/constants/urls';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { smallTabsOverrides } from 'Iaso/styles';
import { SxStyles } from 'Iaso/types/general';
import { usePlanningContext } from '../../contexts/PlanningContext';
import { InfoTab } from '../info/InfoTab';
import { LevelsAndTeamsTab } from '../levelsAndTeams/LevelsAndTeamsTab';
import { PlanningHeaderActions, PlanningHeaderTitle } from './PlanningHeader';
import {
    getActiveTab,
    getFieldsToFix,
    PLANNING_TABS,
    TabKey,
    useSelectPlanningTab,
} from './planningTabs';
import { TabErrorIcon } from './TabErrorIcon';

const styles = {
    tabs: {
        ...smallTabsOverrides,
        flexShrink: 0,
        marginBottom: 3,
    },
    tabWithError: {
        '&, &.Mui-selected': { color: 'error.main' },
    },
} satisfies SxStyles;

export const PlanningDetails: FC = () => {
    const { formatMessage } = useSafeIntl();
    const params = useParamsObject(baseUrls.planningDetails);
    const activeTab = getActiveTab(params.tab);
    const selectTab = useSelectPlanningTab();
    const { formik } = usePlanningContext();
    const { errors, isValid, submitCount } = formik;
    const hasSubmitFailed = submitCount > 0 && !isValid;

    const handleChangeTab = useCallback(
        (_event: SyntheticEvent, tab: TabKey) => selectTab(tab),
        [selectTab],
    );

    return (
        <GreyPageWrapper
            title={<PlanningHeaderTitle />}
            actions={<PlanningHeaderActions />}
        >
            <Tabs value={activeTab} onChange={handleChangeTab} sx={styles.tabs}>
                {PLANNING_TABS.map(tab => {
                    const { key, label, Icon } = tab;
                    // The active tab's fields show their own errors.
                    const fieldsToFix =
                        hasSubmitFailed && key !== activeTab
                            ? getFieldsToFix(tab, errors, formatMessage)
                            : [];
                    return (
                        <Tab
                            key={key}
                            value={key}
                            label={formatMessage(label)}
                            iconPosition="start"
                            icon={
                                fieldsToFix.length > 0 ? (
                                    // Remounted on every failed save to replay its shake.
                                    <TabErrorIcon
                                        key={submitCount}
                                        fieldsToFix={fieldsToFix}
                                    />
                                ) : (
                                    <Icon />
                                )
                            }
                            sx={
                                fieldsToFix.length > 0
                                    ? styles.tabWithError
                                    : undefined
                            }
                        />
                    );
                })}
            </Tabs>
            {activeTab === 'info' && <InfoTab />}
            {activeTab === 'levelsAndTeams' && <LevelsAndTeamsTab />}
        </GreyPageWrapper>
    );
};
