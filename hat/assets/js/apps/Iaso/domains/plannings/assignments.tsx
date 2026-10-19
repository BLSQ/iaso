import React, { FC } from 'react';
import { LoadingSpinner, useGoBack, useSafeIntl } from 'bluesquare-components';
import { MainWrapper } from 'Iaso/components/MainWrapper';
import { baseUrls } from 'Iaso/constants/urls';
import { SxStyles } from 'Iaso/types/general';
import TopBar from '../../components/nav/TopBarComponent';
import { AssignmentsHeader } from './components/assignments/AssignmentsHeader';
import { PlanningStatusChip } from './components/shared/PlanningStatusChip';
import { useGetTeamHierarchy } from './components/teamHierarchy/useTeamHierarchy';
import { useGetPlanningDetails } from './hooks/requests/useGetPlanningDetails';
import { useAssignmentsParams } from './hooks/useAssignmentsParams';
import MESSAGES from './messages';

const styles = {
    wrapper: { p: 4, pt: 3 },
    statusChip: {
        ml: 1.5,
        flexShrink: 0,
        backgroundColor: 'common.white',
    },
} satisfies SxStyles;

export const Assignments: FC = () => {
    const { planningId, teamId } = useAssignmentsParams();
    const { formatMessage } = useSafeIntl();
    const goBack = useGoBack(
        `${baseUrls.planningDetails}/planningId/${planningId}/mode/edit`,
    );
    const { data: planning, isLoading: isLoadingPlanning } =
        useGetPlanningDetails(planningId);
    const rootTeamId = planning?.team_details?.id;
    const { data: teams, isLoading: isLoadingTeams } =
        useGetTeamHierarchy(rootTeamId);
    const scopeTeamId =
        teams?.find(team => `${team.id}` === teamId)?.id ?? rootTeamId;

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
            <MainWrapper sx={styles.wrapper}>
                {(isLoadingPlanning || isLoadingTeams) && <LoadingSpinner />}
                {planning && teams && scopeTeamId && (
                    <AssignmentsHeader
                        planning={planning}
                        teams={teams}
                        scopeTeamId={scopeTeamId}
                    />
                )}
            </MainWrapper>
        </>
    );
};
