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
    excludedUserIds?: number[];
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
    additionalFilters,
    excludedUserIds,
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
        async (input: string) => {
            const options = await getUsersDropDown({
                query: input,
                queryClient: queryClient,
                additionalFilters: additionalFilters,
            });
            if (!excludedUserIds?.length) return options;
            return options.filter(
                option => !excludedUserIds.includes(option.value),
            );
        },
        [queryClient, additionalFilters, excludedUserIds],
    );

    const handleChangeUsers = useCallback(
        (keyValue: string, newValue: any) => {
            const val = multi
                ? newValue?.map((r: { value: string }) => r.value)?.join(',')
                : newValue?.value;
            handleChange(keyValue, val);
        },
        [handleChange, multi],
    );
    const currentUsers = useMemo(() => {
        if (!filterUsers || filterUsers === '') return [];
        return selectedUsers ?? [];
    }, [filterUsers, selectedUsers]);

    return (
        <AsyncSelect
            keyValue={keyValue}
            label={label}
            value={currentUsers}
            onChange={handleChangeUsers}
            debounceTime={500}
            multi={multi}
            clearable={!multi}
            fetchOptions={input => fetchOptions(input)}
            {...props}
        />
    );
};
