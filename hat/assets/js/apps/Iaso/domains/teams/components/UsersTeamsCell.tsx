import React, { FunctionComponent } from 'react';
import { Chip, Box, Tooltip } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import Color from 'color';

import { TEAM_OF_TEAMS, TEAM_OF_USERS } from '../constants';
import MESSAGES from '../messages';

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
    const { formatMessage } = useSafeIntl();
    return (
        <Box pt={1}>
            {type === TEAM_OF_TEAMS && (
                <>
                    {subTeamsDetails.map(team => {
                        const chipStyle = {
                            backgroundColor: team.color,
                            color: Color(team.color).isDark()
                                ? 'white'
                                : 'black',
                        };
                        return (
                            <Box
                                key={team.id}
                                pl={1}
                                pb={1}
                                display="inline-block"
                            >
                                {team.deleted_at && (
                                    <Tooltip
                                        arrow
                                        title={formatMessage(
                                            MESSAGES.teamDeleted,
                                        )}
                                        placement="bottom"
                                    >
                                        <Box>
                                            <Chip
                                                label={team.name}
                                                size="small"
                                                sx={chipStyle}
                                                disabled
                                            />
                                        </Box>
                                    </Tooltip>
                                )}
                                {!team.deleted_at && (
                                    <Chip
                                        label={team.name}
                                        size="small"
                                        sx={chipStyle}
                                    />
                                )}
                            </Box>
                        );
                    })}
                </>
            )}
            {type === TEAM_OF_USERS && (
                <>
                    {usersDetails.map(user => (
                        <Box pl={1} pb={1} display="inline-block" key={user.id}>
                            <Chip
                                size="small"
                                label={user.username}
                                color="primary"
                            />
                        </Box>
                    ))}
                </>
            )}
            {!type && '-'}
        </Box>
    );
};
