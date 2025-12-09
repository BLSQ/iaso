import React, { FunctionComponent } from 'react';

import {
    IntlFormatMessage,
    useSafeIntl,
    useGoBack,
} from 'bluesquare-components';
import { MainWrapper } from 'Iaso/components/MainWrapper';
import { baseUrls } from 'Iaso/constants/urls';
import { useGetPipelineConfig } from 'Iaso/domains/openHexa/hooks/useGetPipelineConfig';

import TopBar from '../../components/nav/TopBarComponent';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { PlanningForm } from './components/PlanningForm';
import { SamplingResults } from './components/SamplingResults';
import MESSAGES from './messages';
import { PageMode } from './types';

const formatTitle = (type: PageMode, formatMessage: IntlFormatMessage) => {
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

    const { data: config } = useGetPipelineConfig();
    const hasPipelineConfig = config?.configured;

    const { formatMessage } = useSafeIntl();

    const titleMessage = formatTitle(params.mode as PageMode, formatMessage);

    const goBack = useGoBack(baseUrls.planning);
    return (
        <>
            <TopBar title={titleMessage} displayBackButton goBack={goBack} />
            <MainWrapper sx={{ p: 4 }}>
                <PlanningForm hasPipelineConfig={hasPipelineConfig || false} />
                {hasPipelineConfig && <SamplingResults />}
            </MainWrapper>
        </>
    );
};
