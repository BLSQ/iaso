import React, { FunctionComponent } from 'react';
import { ColorChip } from 'bluesquare-components';
import { Profile } from 'Iaso/domains/users/types';
import getDisplayName from 'Iaso/utils/usersUtils';

type Props = {
    user: Partial<Profile>;
};

export const UserChip: FunctionComponent<Props> = ({ user }) => {
    return (
        <ColorChip
            label={getDisplayName(user)}
            size="small"
            color={user.color}
        />
    );
};
