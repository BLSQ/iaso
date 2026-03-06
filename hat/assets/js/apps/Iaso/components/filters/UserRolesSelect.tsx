import React, { FC, useCallback } from 'react';
import { Select, useSafeIntl } from 'bluesquare-components';
import type { IntlMessage } from 'bluesquare-components';
import { useGetUserRolesDropDown } from '../../domains/userRoles/hooks/requests/useGetUserRoles';
import { commaSeparatedIdsToArray } from '../../utils/forms';
import MESSAGES from './messages';

type Props = {
    handleChange: (keyValue: string, value: unknown) => void;
    filterUserRoles: any;
    keyValue?: string;
    label?: IntlMessage;
    multi?: boolean;
};

export const UserRolesSelect: FC<Props> = ({
    handleChange,
    filterUserRoles,
    keyValue = 'userRoleIds',
    label = MESSAGES.userRoles,
    multi = true,
}) => {
    const { formatMessage } = useSafeIntl();
    const { data: userRoles, isFetching } = useGetUserRolesDropDown();

    const handleChangeUserRoles = useCallback(
        (newValue: string) => {
            const value =
                newValue && newValue.length > 0 ? newValue : undefined;
            handleChange(keyValue, value);
        },
        [handleChange, keyValue],
    );

    const value = commaSeparatedIdsToArray(filterUserRoles);

    return (
        <Select
            keyValue={keyValue}
            label={formatMessage(label)}
            value={value}
            options={userRoles || []}
            onChange={handleChangeUserRoles}
            loading={isFetching}
            multi={multi}
            clearable
            filterable
        />
    );
};
