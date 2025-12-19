import React, { FunctionComponent } from 'react';

import { useSafeIntl, useGoBack } from 'bluesquare-components';
import { MainWrapper } from 'Iaso/components/MainWrapper';
import { baseUrls } from 'Iaso/constants/urls';
import { useGetPipelineConfig } from 'Iaso/domains/openHexa/hooks/useGetPipelineConfig';

import TopBar from '../../components/nav/TopBarComponent';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { PlanningForm } from './components/PlanningForm';
import { SamplingResults } from './components/SamplingResults';
import { useGetPlanningDetails } from './hooks/requests/useGetPlanningDetails';
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
    const { data: config } = useGetPipelineConfig();
    const hasPipelineConfig = config?.configured;

    const titleMessage = useFormatTitle(params.mode as PageMode);

    const { data: planning } = useGetPlanningDetails(planningId);
    const goBack = useGoBack(baseUrls.planning);
    return (
        <>
            <TopBar title={titleMessage} displayBackButton goBack={goBack} />
            <MainWrapper sx={{ p: 4 }}>
                <PlanningForm
                    hasPipelineConfig={hasPipelineConfig || false}
                    planning={planning}
                    mode={params.mode as PageMode}
                />
                {hasPipelineConfig && planning && params.mode !== 'copy' && (
                    <SamplingResults planning={planning} />
                )}
            </MainWrapper>
        </>
    );
};
