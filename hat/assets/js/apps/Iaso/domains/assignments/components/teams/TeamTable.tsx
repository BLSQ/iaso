import React, { Dispatch, FunctionComponent, useCallback } from 'react';
import {
    Table,
    Paper,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';
import MESSAGES from 'Iaso/domains/assignments/messages';
import { useSaveTeam } from 'Iaso/domains/teams/hooks/requests/useSaveTeam';
import { SubTeam, Team } from 'Iaso/domains/teams/types/team';
import { User } from 'Iaso/domains/teams/types/team';
import { useSaveProfileColor } from 'Iaso/domains/users/hooks/useSaveProfile';
import getDisplayName from 'Iaso/utils/usersUtils';
import { AssignmentsResult } from '../../hooks/requests/useGetAssignments';
import { AssigneeRow } from './AssigneeRow';

const defaultHeight = '80vh';

type Props = {
    rootTeam?: Team;
    isLoadingRootTeam: boolean;
    selectedUser?: User;
    setSelectedUser: Dispatch<React.SetStateAction<User | undefined>>;
    selectedTeam?: SubTeam;
    setSelectedTeam: Dispatch<React.SetStateAction<SubTeam | undefined>>;
    assignments?: AssignmentsResult;
};

export const TeamTable: FunctionComponent<Props> = ({
    rootTeam,
    isLoadingRootTeam,
    selectedUser,
    setSelectedUser,
    selectedTeam,
    setSelectedTeam,
    assignments,
}) => {
    const { formatMessage } = useSafeIntl();

    const { mutate: updateTeam } = useSaveTeam('edit', false);
    const { mutate: updateUser } = useSaveProfileColor(false);

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
    const countUsers = useCallback(
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
            <Paper sx={{ height: defaultHeight }}>
                {isLoadingRootTeam && (
                    <LoadingSpinner fixed={false} transparent absolute />
                )}
                {rootTeam && (
                    <>
                        <Typography variant="h6">{rootTeam?.name}</Typography>
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
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rootTeam?.sub_teams_details.map(subTeam => (
                                    <AssigneeRow
                                        key={subTeam.id}
                                        isActive={
                                            selectedTeam?.id === subTeam.id
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
                                    />
                                ))}
                                {rootTeam?.users_details
                                    .sort((a, b) =>
                                        a.username.localeCompare(b.username),
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
                                            displayName={getDisplayName(user)}
                                            count={countUsers(user)}
                                            onColorChange={color => {
                                                updateUser({
                                                    id: user.iaso_profile_id,
                                                    color,
                                                });
                                            }}
                                        />
                                    ))}
                            </TableBody>
                        </Table>
                    </>
                )}
            </Paper>
        </>
    );
};
