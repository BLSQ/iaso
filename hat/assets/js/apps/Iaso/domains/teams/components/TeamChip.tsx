import React, { FunctionComponent } from 'react';
import { Chip } from '@mui/material';
import Color from 'color';
import { Team } from '../types/team';

type Props = {
    team: Partial<Team>;
};

export const TeamChip: FunctionComponent<Props> = ({ team }) => {
    const textColor = Color(team.color).isDark() ? 'white' : 'black';
    return (
        <Chip
            label={team.name}
            size="small"
            sx={{
                backgroundColor: team.color,
                color: textColor,
                fontSize: '0.8rem',
            }}
        />
    );
};
