import React, { FC } from 'react';
import { LoadingSpinner, useGoBack, useSafeIntl } from 'bluesquare-components';
import { MainWrapper } from 'Iaso/components/MainWrapper';
import { baseUrls } from 'Iaso/constants/urls';
import { SxStyles } from 'Iaso/types/general';
import TopBar from '../../components/nav/TopBarComponent';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { useGetPlanningDetails } from './hooks/requests/useGetPlanningDetails';
import MESSAGES from './messages';
import { AssignmentsParams } from './types';

const styles = {
    wrapper: { p: 4, pt: 3 },
} satisfies SxStyles;

export const Assignments: FC = () => {
    const { planningId } = useParamsObject(
        baseUrls.assignments,
    ) as unknown as AssignmentsParams;
    const { formatMessage } = useSafeIntl();
    const goBack = useGoBack(
        `${baseUrls.planningDetails}/planningId/${planningId}/mode/edit`,
    );
    const { data: planning, isLoading } = useGetPlanningDetails(planningId);

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.assignmentsForPlanning, {
                    name: planning?.name ?? '',
                })}
                displayBackButton
                goBack={goBack}
            />
            <MainWrapper sx={styles.wrapper}>
                {isLoading && <LoadingSpinner />}
            </MainWrapper>
        </>
    );
};
