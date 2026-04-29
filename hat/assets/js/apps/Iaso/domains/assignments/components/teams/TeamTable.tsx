import React, { Dispatch, FunctionComponent, useCallback } from 'react';
import {
    Table,
    Paper,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
    Box,
} from '@mui/material';
import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';
import MESSAGES from 'Iaso/domains/assignments/messages';
import { useSaveTeam } from 'Iaso/domains/teams/hooks/requests/useSaveTeam';
import { SubTeam, Team } from 'Iaso/domains/teams/types/team';
import { User } from 'Iaso/domains/teams/types/team';
import { useSaveProfile } from 'Iaso/domains/users/hooks/useSaveProfile';
import { SxStyles } from 'Iaso/types/general';
import getDisplayName from 'Iaso/utils/usersUtils';
import { AssignmentsResult } from '../../hooks/requests/useGetAssignments';
import { AssigneeRow } from './AssigneeRow';

const defaultHeight = '80vh';

const styles: SxStyles = {
    paper: {
        height: defaultHeight,
    },
    title: {
        pt: theme => theme.spacing(2),
        pl: theme => theme.spacing(2),
    },
    tableContainer: {
        maxHeight: '75vh',
        overflow: 'auto',
        scrollbarWidth: 'thin',
    },
};

type Props = {
    rootTeam?: Team;
    planningId: string;
    isLoadingRootTeam: boolean;
    selectedUser?: User;
    setSelectedUser: Dispatch<React.SetStateAction<User | undefined>>;
    selectedTeam?: SubTeam;
    setSelectedTeam: Dispatch<React.SetStateAction<SubTeam | undefined>>;
    assignments?: AssignmentsResult;
};

export const TeamTable: FunctionComponent<Props> = ({
    rootTeam,
    planningId,
    isLoadingRootTeam,
    selectedUser,
    setSelectedUser,
    selectedTeam,
    setSelectedTeam,
    assignments,
}) => {
    const { formatMessage } = useSafeIntl();

    const { mutate: updateTeam } = useSaveTeam('edit', false);
    const { mutate: updateUser } = useSaveProfile({
        showSuccessSnackBar: false,
        extraInvalidateQueryKeys: ['planningChildrenOrgUnitsPaginated'],
    });

    const countTeams = useCallback(
        (subTeam: SubTeam) => {
            return (
                assignments?.allAssignments?.filter(
                    assignment => assignment.team === subTeam.id,
                ).length || 0
            );
        },
        [assignments],
    );
    const assignmentsCountForUser = useCallback(
        (user: User) => {
            return (
                assignments?.allAssignments?.filter(
                    assignment => assignment.user === user.id,
                ).length || 0
            );
        },
        [assignments],
    );
    return (
        <>
            <Paper sx={styles.paper}>
                {isLoadingRootTeam && (
                    <LoadingSpinner fixed={false} transparent absolute />
                )}
                {rootTeam && (
                    <>
                        <Typography sx={styles.title} variant="h6">
                            {rootTeam?.name}
                        </Typography>
                        <Box sx={styles.tableContainer}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell
                                            sx={{
                                                width: 50,
                                            }}
                                        >
                                            {formatMessage(MESSAGES.selection)}
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                width: 50,
                                            }}
                                        >
                                            {formatMessage(MESSAGES.color)}
                                        </TableCell>
                                        <TableCell>
                                            {formatMessage(MESSAGES.name)}
                                        </TableCell>
                                        <TableCell>
                                            {formatMessage(
                                                MESSAGES.assignationsCount,
                                            )}
                                        </TableCell>
                                        <TableCell />
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {rootTeam?.sub_teams_details.map(
                                        subTeam => (
                                            <AssigneeRow
                                                key={subTeam.id}
                                                isActive={
                                                    selectedTeam?.id ===
                                                    subTeam.id
                                                }
                                                setSelectedRow={() =>
                                                    setSelectedTeam(subTeam)
                                                }
                                                currentColor={subTeam?.color}
                                                displayName={subTeam?.name}
                                                count={countTeams(subTeam)}
                                                onColorChange={color => {
                                                    updateTeam({
                                                        id: subTeam.id,
                                                        color,
                                                    });
                                                }}
                                                team={subTeam}
                                                planningId={planningId}
                                            />
                                        ),
                                    )}
                                    {rootTeam?.users_details
                                        .sort((a, b) =>
                                            a.username.localeCompare(
                                                b.username,
                                            ),
                                        )
                                        .map(user => (
                                            <AssigneeRow
                                                key={user.id}
                                                isActive={
                                                    selectedUser?.id === user.id
                                                }
                                                setSelectedRow={() =>
                                                    setSelectedUser(user)
                                                }
                                                currentColor={user?.color}
                                                count={assignmentsCountForUser(
                                                    user,
                                                )}
                                                onColorChange={color => {
                                                    updateUser({
                                                        id: user.iaso_profile_id,
                                                        color,
                                                    });
                                                }}
                                                user={user}
                                                displayName={getDisplayName(
                                                    user,
                                                )}
                                                planningId={planningId}
                                            />
                                        ))}
                                </TableBody>
                            </Table>
                        </Box>
                    </>
                )}
            </Paper>
        </>
    );
};
