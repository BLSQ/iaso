import React, { FunctionComponent } from 'react';

import { useSafeIntl, useGoBack } from 'bluesquare-components';
import { MainWrapper } from 'Iaso/components/MainWrapper';
import { baseUrls } from 'Iaso/constants/urls';

import TopBar from '../../components/nav/TopBarComponent';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { PlanningDetails } from './components/PlanningDetails';
import { PlanningProvider } from './contexts/PlanningContext';
import MESSAGES from './messages';
import { PageMode } from './types';

const useFormatTitle = (type: PageMode) => {
    const { formatMessage } = useSafeIntl();
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
    const titleMessage = useFormatTitle(params.mode as PageMode);
    const goBack = useGoBack(baseUrls.planning);
    return (
        <>
            <TopBar title={titleMessage} displayBackButton goBack={goBack} />
            <MainWrapper sx={{ p: 4 }}>
                <PlanningProvider
                    planningId={planningId}
                    mode={params.mode as PageMode}
                    newMissionId={params.newMissionId}
                >
                    <PlanningDetails />
                </PlanningProvider>
            </MainWrapper>
        </>
    );
};
