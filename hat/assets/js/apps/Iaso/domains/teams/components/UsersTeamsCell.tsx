import React, { FunctionComponent } from 'react';
import { Chip, Box } from '@material-ui/core';

import { TEAM_OF_TEAMS, TEAM_OF_USERS } from '../constants';

import { SubTeam, User } from '../types/team';

type Props = {
    type: string;
    subTeamsDetails: Array<SubTeam>;
    usersDetails: Array<User>;
};

export const UsersTeamsCell: FunctionComponent<Props> = ({
    type,
    subTeamsDetails,
    usersDetails,
}) => {
    return (
        <>
            {type === TEAM_OF_TEAMS && (
                <>
                    {subTeamsDetails.map(team => (
                        <Box key={team.id} ml={1} display="inline-block">
                            <Chip label={team.name} color="primary" />
                        </Box>
                    ))}
                </>
            )}
            {type === TEAM_OF_USERS && (
                <>
                    {usersDetails.map(user => (
                        <Box ml={1} display="inline-block" key={user.id}>
                            <Chip label={user.username} color="secondary" />
                        </Box>
                    ))}
                </>
            )}
            {!type && '-'}
        </>
    );
};
