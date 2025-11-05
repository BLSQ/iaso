import React, { FC, useCallback } from 'react';
import { getUsersDropDown } from '../../domains/instances/hooks/requests/getUsersDropDown';
import { useGetProfilesDropdown } from '../../domains/instances/hooks/useGetProfilesDropdown';
import { AsyncSelect } from '../forms/AsyncSelect';
import MESSAGES from './messages';

type Props = {
    handleChange: (keyValue: string, value: unknown) => void;
    filterUsers: any;
    keyValue?: string;
};

export const UserAsyncSelect: FC<Props> = ({
    handleChange,
    filterUsers,
    keyValue = 'users',
}) => {
    const { data: selectedUsers } = useGetProfilesDropdown(filterUsers);
    const handleChangeUsers = useCallback(
        (keyValue, newValue) => {
            const joined = newValue?.map(r => r.value)?.join(',');
            handleChange(keyValue, joined);
        },
        [handleChange],
    );

    return (
        <AsyncSelect
            keyValue={keyValue}
            label={MESSAGES.user}
            value={selectedUsers ?? ''}
            onChange={handleChangeUsers}
            debounceTime={500}
            multi
            fetchOptions={input => getUsersDropDown(input)}
        />
    );
};
