import React, { FunctionComponent, useCallback } from 'react';
import { TableBody } from '@mui/material';
import { SubTeam, Team } from 'Iaso/domains/teams/types/team';
import { User } from 'Iaso/domains/teams/types/team';
import getDisplayName from 'Iaso/utils/usersUtils';
import { useAssignmentsContext } from '../../contexts/AssignmentsContext';
import { assignmentsCountForUser, countTeams } from '../../utils';
import { AssigneeRow } from './AssigneeRow';

type Props = {
    rootTeam: Team | SubTeam;
};

export const TeamTableBody: FunctionComponent<Props> = ({ rootTeam }) => {
    const {
        selectedUser,
        setSelectedUser,
        selectedTeam,
        setSelectedTeam,
        assignments,
        updateTeam,
        updateUser,
    } = useAssignmentsContext();

    const handleSelectRow = useCallback(
        ({ team, user }: { team?: SubTeam; user?: User }) => {
            if (team) {
                setSelectedTeam(team);
                setSelectedUser(undefined);
            }
            if (user) {
                setSelectedUser(user);
                setSelectedTeam(undefined);
            }
        },
        [setSelectedTeam, setSelectedUser],
    );
    return (
        <TableBody>
            {rootTeam.sub_teams_details.map(subTeam => (
                <AssigneeRow
                    key={subTeam.id}
                    isActive={selectedTeam?.id === subTeam.id}
                    setSelectedRow={() => handleSelectRow({ team: subTeam })}
                    currentColor={subTeam.color}
                    displayName={subTeam.name}
                    count={countTeams(subTeam, assignments)}
                    onColorChange={color => {
                        updateTeam({
                            id: subTeam.id,
                            color,
                        });
                    }}
                    team={subTeam}
                />
            ))}
            {rootTeam.users_details
                .sort((a, b) => a.username.localeCompare(b.username))
                .map(user => (
                    <AssigneeRow
                        key={user.id}
                        isActive={selectedUser?.id === user.id}
                        setSelectedRow={() => handleSelectRow({ user })}
                        currentColor={user.color}
                        count={assignmentsCountForUser(user, assignments)}
                        onColorChange={color => {
                            updateUser({
                                id: user.iaso_profile_id,
                                color,
                            });
                        }}
                        user={user}
                        displayName={getDisplayName(user)}
                    />
                ))}
        </TableBody>
    );
};
