import React, { FunctionComponent } from 'react';
import { useSafeIntl, useGoBack } from 'bluesquare-components';
import { MainWrapper } from 'Iaso/components/MainWrapper';
import TopBar from '../../components/nav/TopBarComponent';
import { baseUrls } from '../../constants/urls';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { useGetPlanningDetails } from '../plannings/hooks/requests/useGetPlanningDetails';
import { Planning } from '../plannings/types';
import MESSAGES from './messages';
import { AssignmentParams } from './types/assigment';

export const Assignments: FunctionComponent = () => {
    const params: AssignmentParams = useParamsObject(
        baseUrls.assignments,
    ) as unknown as AssignmentParams;
    const { formatMessage } = useSafeIntl();

    const { planningId } = params;
    const {
        data: planning,
        isLoading: isLoadingPlanning,
    }: {
        data?: Planning;
        isLoading: boolean;
    } = useGetPlanningDetails(planningId);
    const goBack = useGoBack(baseUrls.planning);
    console.log(planning);
    return (
        <>
            <TopBar
                title={`${formatMessage(MESSAGES.title)}: ${
                    planning?.name ?? ''
                }`}
                displayBackButton
                goBack={goBack}
            />

            <MainWrapper sx={{ p: 4 }}>NEW PAGE</MainWrapper>
        </>
    );
};
