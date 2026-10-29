import React, { FC } from 'react';
import { LoadingSpinner, useGoBack, useSafeIntl } from 'bluesquare-components';
import { baseUrls } from 'Iaso/constants/urls';
import { SxStyles } from 'Iaso/types/general';
import TopBar from '../../components/nav/TopBarComponent';
import { AssignmentsContent } from './components/assignments/AssignmentsContent';
import { PlanningStatusChip } from './components/shared/PlanningStatusChip';
import { useGetPlanningDetails } from './hooks/requests/useGetPlanningDetails';
import { useAssignmentsParams } from './hooks/useAssignmentsParams';
import MESSAGES from './messages';

const styles = {
    statusChip: {
        ml: 1.5,
        flexShrink: 0,
        backgroundColor: 'common.white',
    },
} satisfies SxStyles;

export const Assignments: FC = () => {
    const { planningId } = useAssignmentsParams();
    const { formatMessage } = useSafeIntl();
    const goBack = useGoBack(
        `${baseUrls.planningDetails}/planningId/${planningId}/mode/edit`,
    );
    const { data: planning, isLoading } = useGetPlanningDetails(planningId);
    const rootTeamId = planning?.team_details?.id;

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.assignmentsForPlanning, {
                    name: planning?.name ?? '',
                })}
                titleAdornment={
                    planning?.status && (
                        <PlanningStatusChip
                            status={planning.status}
                            sx={styles.statusChip}
                        />
                    )
                }
                displayBackButton
                goBack={goBack}
            />
            {isLoading && <LoadingSpinner />}
            {planning && rootTeamId && (
                <AssignmentsContent
                    planning={planning}
                    rootTeamId={rootTeamId}
                />
            )}
        </>
    );
};
