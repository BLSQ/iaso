import React, { FunctionComponent } from 'react';

import { useSafeIntl, useGoBack } from 'bluesquare-components';
import { baseUrls } from 'Iaso/constants/urls';

import TopBar from '../../components/nav/TopBarComponent';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { PlanningDetails } from './components/details/PlanningDetails';
import { PlanningProvider } from './contexts/PlanningContext';
import { useGetPlanningDetails } from './hooks/requests/useGetPlanningDetails';
import MESSAGES from './messages';
import { PageMode } from './types';

const useFormatTitle = (type: PageMode, isDeprecated: boolean) => {
    const { formatMessage } = useSafeIntl();
    if (isDeprecated) {
        return formatMessage(MESSAGES.planningDetails);
    }
    switch (type) {
        case 'create':
            return formatMessage(MESSAGES.createPlanning);
        case 'edit':
            return formatMessage(MESSAGES.editPlanning);
        case 'copy':
            return formatMessage(MESSAGES.duplicatePlanning);
        default:
            return formatMessage(MESSAGES.createPlanning);
    }
};
export const Details: FunctionComponent = () => {
    const params = useParamsObject(baseUrls.planningDetails);
    const { planningId } = params;
    const { data: planning } = useGetPlanningDetails(planningId);
    const titleMessage = useFormatTitle(
        params.mode as PageMode,
        Boolean(planning?.deprecated),
    );
    const goBack = useGoBack(baseUrls.planning);
    return (
        <>
            <TopBar title={titleMessage} displayBackButton goBack={goBack} />
            <PlanningProvider
                planningId={planningId}
                mode={params.mode as PageMode}
                newMissionId={params.newMissionId}
            >
                <PlanningDetails />
            </PlanningProvider>
        </>
    );
};
