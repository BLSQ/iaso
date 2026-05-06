import React, { FunctionComponent, useCallback, useState } from 'react';
import ChevronRight from '@mui/icons-material/ChevronRight';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button, Grid, Typography, Tabs, Tab } from '@mui/material';
import {
    useSafeIntl,
    useGoBack,
    useTabs,
    Optional,
    useRedirectToReplace,
} from 'bluesquare-components';
import DeleteDialog from 'Iaso/components/dialogs/DeleteDialogComponent';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { MainWrapper } from 'Iaso/components/MainWrapper';
import { smallInputOverrides } from 'Iaso/styles';
import TopBar from '../../components/nav/TopBarComponent';
import { baseUrls } from '../../constants/urls';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { useGetPlanningDetails } from '../plannings/hooks/requests/useGetPlanningDetails';
import { Planning } from '../plannings/types';
import { useGetTeam } from '../teams/hooks/requests/useGetTeams';
import { SubTeam, User } from '../teams/types/team';
import { AssignmentsMap } from './components/AssignmentsMap';
import { AssignmentsTable } from './components/AssignmentsTable';
import { TeamTable } from './components/teams/TeamTable';
import { useBulkDeleteAssignments } from './hooks/requests/useBulkDeleteAssignments';
import { useGetAssignments } from './hooks/requests/useGetAssignments';
import { AssignmentsResult } from './hooks/requests/useGetAssignments';
import { useSaveAssignment } from './hooks/requests/useSaveAssignment';
import MESSAGES from './messages';
import { AssignmentParams } from './types/assigment';

export const Assignments: FunctionComponent = () => {
    const params: AssignmentParams = useParamsObject(
        baseUrls.assignments,
    ) as unknown as AssignmentParams;
    const [selectedUser, setSelectedUser] = useState<User | undefined>(
        undefined,
    );
    const [search, setSearch] = useState<string | undefined>(params.search);
    const [selectedTeam, setSelectedTeam] = useState<SubTeam | undefined>(
        undefined,
    );
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
    const { mutateAsync: deleteAssignments } = useBulkDeleteAssignments();

    const { tab, handleChangeTab } = useTabs<'list' | 'map'>({
        params: params as Record<string, Optional<string>>,
        defaultTab: (params?.tab ?? 'map') as 'list' | 'map',
        baseUrl: baseUrls.assignments,
    });
    const canAssign = Boolean(selectedUser || selectedTeam);
    const redirectToReplace = useRedirectToReplace();
    const handleSearch = useCallback(() => {
        redirectToReplace(baseUrls.assignments, {
            ...params,
            search,
        });
    }, [params, search, redirectToReplace]);
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
                {planning && (
                    <Box display="flex" justifyContent="space-between" mb={2}>
                        <Typography
                            variant="h6"
                            display="flex"
                            alignItems="center"
                        >
                            {planning.org_unit_details?.name}
                            <ChevronRight sx={{ fontSize: 40, px: 1 }} />
                            {planning.target_org_unit_type_details
                                ?.map(t => t.name)
                                .join(', ')}
                        </Typography>
                        <DeleteDialog
                            iconColor="error"
                            titleMessage={MESSAGES.deleteAllAssignments}
                            message={{
                                ...MESSAGES.deleteAssignmentsWarning,
                                values: {
                                    count: planning?.assignments_count,
                                },
                            }}
                            onConfirm={() =>
                                deleteAssignments({ planning: planningId })
                            }
                            keyName="delete-all-assignments"
                            Trigger={({ onClick }) => (
                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={onClick}
                                    disabled={planning.assignments_count === 0}
                                    startIcon={<DeleteIcon />}
                                    sx={{
                                        marginRight: theme => theme.spacing(2),
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {formatMessage(
                                        MESSAGES.deleteAllAssignments,
                                    )}
                                </Button>
                            )}
                        />
                    </Box>
                )}

                <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                        <Grid container spacing={0}>
                            <Grid item xs={12} md={8}>
                                <Tabs value={tab} onChange={handleChangeTab}>
                                    <Tab
                                        value="map"
                                        label={formatMessage(MESSAGES.map)}
                                    />
                                    <Tab
                                        value="list"
                                        label={formatMessage(MESSAGES.list)}
                                    />
                                </Tabs>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Box
                                    sx={{
                                        marginTop: '-15px',
                                        ...smallInputOverrides,
                                    }}
                                >
                                    <InputComponent
                                        keyValue="search"
                                        onChange={(
                                            _key: string | null,
                                            value: string,
                                        ) => setSearch(value)}
                                        value={search}
                                        type="search"
                                        label={MESSAGES.searchOrgUnit}
                                        onEnterPressed={handleSearch}
                                        blockForbiddenChars
                                    />
                                </Box>
                            </Grid>
                        </Grid>
                        {tab === 'map' && (
                            <AssignmentsMap
                                planningId={planningId}
                                rootTeam={rootTeam}
                                isLoadingRootTeam={isLoadingRootTeam}
                                assignments={assignments}
                                isLoadingAssignments={isLoadingAssignments}
                                handleSaveAssignment={handleSaveAssignment}
                                isSaving={isSaving}
                                planning={planning}
                                canAssign={canAssign}
                                params={params}
                            />
                        )}
                        {tab === 'list' && (
                            <AssignmentsTable
                                params={params}
                                canAssign={canAssign}
                                handleSaveAssignment={handleSaveAssignment}
                                isSaving={isSaving}
                                selectedUser={selectedUser}
                                selectedTeam={selectedTeam}
                            />
                        )}
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
            </MainWrapper>
        </>
    );
};
