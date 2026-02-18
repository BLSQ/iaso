import React, { FunctionComponent, useState } from 'react';
import ChevronRight from '@mui/icons-material/ChevronRight';
import { Grid, Typography } from '@mui/material';
import { useSafeIntl, useGoBack } from 'bluesquare-components';
import { MainWrapper } from 'Iaso/components/MainWrapper';
import TopBar from '../../components/nav/TopBarComponent';
import { baseUrls } from '../../constants/urls';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { useGetPlanningDetails } from '../plannings/hooks/requests/useGetPlanningDetails';
import { Planning } from '../plannings/types';
import { useGetTeam } from '../teams/hooks/requests/useGetTeams';
import { SubTeam, User } from '../teams/types/team';
import { AssignmentsMap } from './components/AssignmentsMap';
import { TeamTable } from './components/teams/TeamTable';
import { useGetAssignments } from './hooks/requests/useGetAssignments';
import { AssignmentsResult } from './hooks/requests/useGetAssignments';
import { useSaveAssignment } from './hooks/requests/useSaveAssignment';
import MESSAGES from './messages';
import { AssignmentParams } from './types/assigment';

export const Assignments: FunctionComponent = () => {
    const [selectedUser, setSelectedUser] = useState<User | undefined>(
        undefined,
    );
    const [selectedTeam, setSelectedTeam] = useState<SubTeam | undefined>(
        undefined,
    );
    const params: AssignmentParams = useParamsObject(
        baseUrls.assignments,
    ) as unknown as AssignmentParams;
    const { formatMessage } = useSafeIntl();

    const { planningId } = params;
    const {
        data: planning,
    }: {
        data?: Planning;
        isLoading: boolean;
    } = useGetPlanningDetails(planningId);

    const goBack = useGoBack(baseUrls.planning);

    const { data: rootTeam, isLoading: isLoadingRootTeam } = useGetTeam(
        planning?.team_details?.id,
    );

    const {
        data: assignments,
        isLoading: isLoadingAssignments,
    }: {
        data?: AssignmentsResult;
        isLoading: boolean;
    } = useGetAssignments({ planning: planningId });
    const { handleSaveAssignment, isLoading: isSaving } = useSaveAssignment({
        planningId,
        assignments,
        selectedUser,
        selectedTeam,
    });

    return (
        <>
            <TopBar
                title={`${formatMessage(MESSAGES.title)}: ${
                    planning?.name ?? ''
                }`}
                displayBackButton
                goBack={goBack}
            />

            <MainWrapper sx={{ p: 4 }}>
                <>
                    {planning && (
                        <Typography
                            variant="h6"
                            display="flex"
                            alignItems="center"
                        >
                            {planning.org_unit_details?.name}
                            <ChevronRight sx={{ fontSize: 40, px: 1 }} />
                            {planning.target_org_unit_type_details?.name}
                        </Typography>
                    )}

                    <Grid container spacing={2}>
                        <Grid item xs={12} md={8}>
                            <AssignmentsMap
                                planningId={planningId}
                                rootTeam={rootTeam}
                                isLoadingRootTeam={isLoadingRootTeam}
                                assignments={assignments}
                                isLoadingAssignments={isLoadingAssignments}
                                handleSaveAssignment={handleSaveAssignment}
                                isSaving={isSaving}
                                canAssign={Boolean(
                                    selectedUser || selectedTeam,
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TeamTable
                                planningId={planningId}
                                rootTeam={rootTeam}
                                isLoadingRootTeam={isLoadingRootTeam}
                                selectedUser={selectedUser}
                                setSelectedUser={setSelectedUser}
                                selectedTeam={selectedTeam}
                                setSelectedTeam={setSelectedTeam}
                                assignments={assignments}
                            />
                        </Grid>
                    </Grid>
                </>
            </MainWrapper>
        </>
    );
};
