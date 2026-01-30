import React, { FunctionComponent, useCallback, useState } from 'react';
import ChevronRight from '@mui/icons-material/ChevronRight';
import {
    Grid,
    Table,
    Paper,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
    Checkbox,
    useTheme,
} from '@mui/material';
import { useSafeIntl, useGoBack, LoadingSpinner } from 'bluesquare-components';
import { ColorPicker } from 'Iaso/components/forms/ColorPicker';
import { MainWrapper } from 'Iaso/components/MainWrapper';
import getDisplayName, { User } from 'Iaso/utils/usersUtils';
import TopBar from '../../components/nav/TopBarComponent';
import { baseUrls } from '../../constants/urls';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { useGetPlanningDetails } from '../plannings/hooks/requests/useGetPlanningDetails';
import { Planning } from '../plannings/types';
import { useGetTeam } from '../teams/hooks/requests/useGetTeams';
import { useSaveTeam } from '../teams/hooks/requests/useSaveTeam';
import { useSaveProfile } from '../users/hooks/useSaveProfile';
import { AssignmentsMap } from './components/AssignmentsMap';
import { useGetAssignments } from './hooks/requests/useGetAssignments';
import { AssignmentsResult } from './hooks/requests/useGetAssignments';
import { useSaveAssignment } from './hooks/requests/useSaveAssignment';
import MESSAGES from './messages';
import { AssignmentParams } from './types/assigment';

const defaultHeight = '80vh';

export const Assignments: FunctionComponent = () => {
    const [selectedUser, setSelectedUser] = useState<User | undefined>(
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
    const theme = useTheme();

    const { data: rootTeam, isLoading: isLoadingRootTeam } = useGetTeam(
        planning?.team_details?.id,
    );
    const { mutate: updateTeam } = useSaveTeam('edit', false);
    const { mutate: updateUser } = useSaveProfile(false);

    const {
        data: assignments,
        isLoading: isLoadingAssignments,
    }: {
        data?: AssignmentsResult;
        isLoading: boolean;
    } = useGetAssignments({ planning: planningId });
    const { mutateAsync: saveAssignment, isLoading: isSaving } =
        useSaveAssignment();
    const handleSaveAssignment = useCallback(
        (orgUnitId: number) => {
            const existingAssignment = assignments?.allAssignments?.find(
                assignment => assignment.org_unit === orgUnitId,
            );
            const payload = {
                planning: planningId,
                org_unit: orgUnitId,
                id: existingAssignment?.id,
                user:
                    existingAssignment &&
                    selectedUser?.id === existingAssignment.user
                        ? null
                        : selectedUser?.id,
            };

            saveAssignment(payload);
        },
        [
            planningId,
            saveAssignment,
            selectedUser?.id,
            assignments?.allAssignments,
        ],
    );

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
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            {isLoadingRootTeam && <LoadingSpinner />}
                            <Paper sx={{ height: defaultHeight }}>
                                {rootTeam && (
                                    <>
                                        <Typography variant="h6">
                                            {rootTeam?.name}
                                        </Typography>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell
                                                        sx={{
                                                            width: 50,
                                                        }}
                                                    >
                                                        {formatMessage(
                                                            MESSAGES.selection,
                                                        )}
                                                    </TableCell>
                                                    <TableCell
                                                        sx={{
                                                            width: 50,
                                                        }}
                                                    >
                                                        {formatMessage(
                                                            MESSAGES.color,
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatMessage(
                                                            MESSAGES.name,
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatMessage(
                                                            MESSAGES.assignationsCount,
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {rootTeam?.sub_teams_details.map(
                                                    subTeam => (
                                                        <TableRow
                                                            key={subTeam.id}
                                                        >
                                                            <TableCell
                                                                sx={{
                                                                    width: 50,
                                                                }}
                                                            >
                                                                <ColorPicker
                                                                    currentColor={
                                                                        subTeam?.color
                                                                    }
                                                                    displayLabel={
                                                                        false
                                                                    }
                                                                    onChangeColor={color => {
                                                                        updateTeam(
                                                                            {
                                                                                id: subTeam.id,
                                                                                color,
                                                                            },
                                                                        );
                                                                    }}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                {subTeam?.name}
                                                            </TableCell>
                                                        </TableRow>
                                                    ),
                                                )}
                                                {rootTeam?.users_details
                                                    .sort((a, b) =>
                                                        a.username.localeCompare(
                                                            b.username,
                                                        ),
                                                    )
                                                    .map(user => (
                                                        <TableRow
                                                            key={user.id}
                                                            sx={{
                                                                backgroundColor:
                                                                    selectedUser?.id ===
                                                                    user.id
                                                                        ? theme
                                                                              .palette
                                                                              .grey[200]
                                                                        : 'transparent',
                                                            }}
                                                        >
                                                            <TableCell
                                                                sx={{
                                                                    width: 50,
                                                                    textAlign:
                                                                        'center',
                                                                }}
                                                            >
                                                                <Checkbox
                                                                    checked={
                                                                        selectedUser?.id ===
                                                                        user.id
                                                                    }
                                                                    onChange={() =>
                                                                        setSelectedUser(
                                                                            user,
                                                                        )
                                                                    }
                                                                />
                                                            </TableCell>
                                                            <TableCell
                                                                sx={{
                                                                    width: 50,
                                                                    textAlign:
                                                                        'center',
                                                                }}
                                                            >
                                                                <ColorPicker
                                                                    currentColor={
                                                                        user?.color
                                                                    }
                                                                    displayLabel={
                                                                        false
                                                                    }
                                                                    onChangeColor={color => {
                                                                        updateUser(
                                                                            // @ts-ignore
                                                                            {
                                                                                ...user,
                                                                                id: user.iaso_profile,
                                                                                user_name:
                                                                                    user.username,
                                                                                color,
                                                                            },
                                                                        );
                                                                    }}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                {getDisplayName(
                                                                    user,
                                                                )}
                                                            </TableCell>
                                                            <TableCell
                                                                sx={{
                                                                    textAlign:
                                                                        'center',
                                                                }}
                                                            >
                                                                {
                                                                    assignments?.allAssignments?.filter(
                                                                        assignment =>
                                                                            assignment.user ===
                                                                            user.id,
                                                                    ).length
                                                                }
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                            </TableBody>
                                        </Table>
                                    </>
                                )}
                            </Paper>
                        </Grid>
                    </Grid>
                </>
            </MainWrapper>
        </>
    );
};
