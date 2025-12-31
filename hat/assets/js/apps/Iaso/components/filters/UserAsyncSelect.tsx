import React, { FC, useCallback } from 'react';
import { AsyncSelect } from 'bluesquare-components';
import type { IntlMessage } from 'bluesquare-components';
import { getUsersDropDown } from '../../domains/instances/hooks/requests/getUsersDropDown';
import { useGetProfilesDropdown } from '../../domains/instances/hooks/useGetProfilesDropdown';
import MESSAGES from './messages';

type Props = {
    handleChange: (keyValue: string, value: unknown) => void;
    filterUsers: any;
    keyValue?: string;
    label?: IntlMessage;
    multi?: boolean;
};

export const UserAsyncSelect: FC<Props> = ({
    handleChange,
    filterUsers,
    keyValue = 'users',
    label = MESSAGES.user,
    multi = true,
}) => {
    const { data: selectedUsers } = useGetProfilesDropdown(filterUsers);
    const handleChangeUsers = useCallback(
        (keyValue, newValue) => {
            const val = multi
                ? newValue?.map(r => r.value)?.join(',')
                : newValue?.value;
            handleChange(keyValue, val);
        },
        [handleChange, multi],
    );

    return (
        <AsyncSelect
            keyValue={keyValue}
            label={label}
            value={selectedUsers ?? ''}
            onChange={handleChangeUsers}
            debounceTime={500}
            multi={multi}
            clearable={!multi}
            fetchOptions={input => getUsersDropDown(input)}
        />
    );
};
