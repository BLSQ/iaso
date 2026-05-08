import React, { FunctionComponent } from 'react';
import { Chip } from '@mui/material';
import Color from 'color';
import { Profile } from 'Iaso/domains/users/types';
import getDisplayName from 'Iaso/utils/usersUtils';

type Props = {
    user: Partial<Profile>;
};

export const UserChip: FunctionComponent<Props> = ({ user }) => {
    const textColor = Color(user.color).isDark() ? 'white' : 'black';
    return (
        <Chip
            label={getDisplayName(user)}
            size="small"
            sx={{
                backgroundColor: user.color,
                color: textColor,
                fontSize: '0.8rem',
            }}
        />
    );
};
