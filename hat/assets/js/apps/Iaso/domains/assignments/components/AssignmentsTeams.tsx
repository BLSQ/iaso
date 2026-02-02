import React, { Dispatch, FunctionComponent } from 'react';
import {
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
import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';
import { ColorPicker } from 'Iaso/components/forms/ColorPicker';
import MESSAGES from 'Iaso/domains/assignments/messages';
import { useSaveTeam } from 'Iaso/domains/teams/hooks/requests/useSaveTeam';
import { SubTeam, Team } from 'Iaso/domains/teams/types/team';
import { User } from 'Iaso/domains/teams/types/team';
import { useSaveProfile } from 'Iaso/domains/users/hooks/useSaveProfile';
import getDisplayName from 'Iaso/utils/usersUtils';
import { AssignmentsResult } from '../hooks/requests/useGetAssignments';

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

export const AssignmentsTeams: FunctionComponent<Props> = ({
    rootTeam,
    isLoadingRootTeam,
    selectedUser,
    setSelectedUser,
    selectedTeam,
    setSelectedTeam,
    assignments,
}) => {
    const { formatMessage } = useSafeIntl();

    const theme = useTheme();

    const { mutate: updateTeam } = useSaveTeam('edit', false);
    const { mutate: updateUser } = useSaveProfile(false);
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
                                    <TableRow key={subTeam.id}>
                                        <TableCell
                                            sx={{
                                                width: 50,
                                                textAlign: 'center',
                                            }}
                                        >
                                            <Checkbox
                                                checked={
                                                    selectedTeam?.id ===
                                                    subTeam.id
                                                }
                                                onChange={() =>
                                                    setSelectedTeam(subTeam)
                                                }
                                            />
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                width: 50,
                                            }}
                                        >
                                            <ColorPicker
                                                currentColor={subTeam?.color}
                                                displayLabel={false}
                                                onChangeColor={color => {
                                                    updateTeam({
                                                        id: subTeam.id,
                                                        color,
                                                    });
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>{subTeam?.name}</TableCell>

                                        <TableCell
                                            sx={{
                                                textAlign: 'center',
                                            }}
                                        >
                                            {
                                                assignments?.allAssignments?.filter(
                                                    assignment =>
                                                        assignment.team ===
                                                        subTeam.id,
                                                ).length
                                            }
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {rootTeam?.users_details
                                    .sort((a, b) =>
                                        a.username.localeCompare(b.username),
                                    )
                                    .map(user => (
                                        <TableRow
                                            key={user.id}
                                            sx={{
                                                backgroundColor:
                                                    selectedUser?.id === user.id
                                                        ? theme.palette
                                                              .grey[200]
                                                        : 'transparent',
                                            }}
                                        >
                                            <TableCell
                                                sx={{
                                                    width: 50,
                                                    textAlign: 'center',
                                                }}
                                            >
                                                <Checkbox
                                                    checked={
                                                        selectedUser?.id ===
                                                        user.id
                                                    }
                                                    onChange={() =>
                                                        setSelectedUser(user)
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    width: 50,
                                                    textAlign: 'center',
                                                }}
                                            >
                                                <ColorPicker
                                                    currentColor={user?.color}
                                                    displayLabel={false}
                                                    onChangeColor={color => {
                                                        updateUser({
                                                            id: user.iaso_profile_id,
                                                            color,
                                                        });
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {getDisplayName(user)}
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    textAlign: 'center',
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
        </>
    );
};
