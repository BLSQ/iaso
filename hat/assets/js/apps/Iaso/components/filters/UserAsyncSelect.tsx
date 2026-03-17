import React, { ComponentProps, useCallback, useMemo } from 'react';
import { AsyncSelect } from 'bluesquare-components';
import type { IntlMessage } from 'bluesquare-components';
import { useQueryClient } from 'react-query';
import { getUsersDropDown } from 'Iaso/domains/instances/hooks/requests/getUsersDropDown';
import { useGetProfilesDropdown } from 'Iaso/domains/users/hooks/useGetProfilesDropdown';
import MESSAGES from './messages';

type Props = {
    handleChange: (keyValue: string, value: unknown) => void;
    filterUsers?: string;
    keyValue?: string;
    label?: IntlMessage;
    additionalFilters?: object;
    multi?: boolean;
} & Omit<
    ComponentProps<typeof AsyncSelect>,
    | 'keyValue'
    | 'label'
    | 'multi'
    | 'value'
    | 'onChange'
    | 'fetchOptions'
    | 'clearable'
    | 'debounceTime'
>;

export const UserAsyncSelect = ({
    handleChange,
    filterUsers,
    additionalFilters = {},
    keyValue = 'users',
    label = MESSAGES.user,
    multi = true,
    ...props
}: Props) => {
    const queryClient = useQueryClient();

    const query = useMemo(() => {
        return {
            ...(filterUsers ? { ids: filterUsers } : {}),
        };
    }, [filterUsers]);

    const { data: selectedUsers } = useGetProfilesDropdown({
        query: query,
        additionalFilters: additionalFilters,
        triggerWithEmptyQuery: false,
    });

    const fetchOptions = useCallback(
        (input: string) => {
            return getUsersDropDown({ query: input, queryClient: queryClient });
        },
        [queryClient],
    );

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
            fetchOptions={input => fetchOptions(input)}
            {...props}
        />
    );
};
