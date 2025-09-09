import React, { ReactElement } from 'react';
import getDisplayName, { User } from '../../utils/usersUtils';

export const UserCell = (cellInfo: { value?: Partial<User> }): ReactElement => {
    const value = cellInfo?.value ?? '';
    return <span>{value ? getDisplayName(value) : '--'}</span>;
};
