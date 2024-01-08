/* eslint-disable react/jsx-props-no-spreading */
import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { FormikProps, FieldInputProps } from 'formik';
// @ts-ignore
import { Select } from 'bluesquare-components';
import { Chip } from '@mui/material';

import getDisplayName, { useCurrentUser } from '../../../utils/usersUtils';
import { useGetProfiles } from '../../users/hooks/useGetProfiles';

type FormValues = {
    users: string;
};

type Props = {
    field?: FieldInputProps<number[]>;
    form?: FormikProps<FormValues>;
    label?: string;
    isNewPage?: boolean;
    managedUsersOnly?: string;
};

export const UsersSelect: FunctionComponent<Props> = ({
    field,
    form,
    label = '',
    isNewPage = false,
    managedUsersOnly = 'true',
    ...props
} = {}) => {
    const currentUser = useCurrentUser();
    const value = useMemo(() => {
        if (isNewPage && (!field?.value || field?.value?.length === 0)) {
            return [currentUser.user_id];
        }
        return field?.value;
    }, [currentUser.user_id, field?.value, isNewPage]);
    const { data, isFetching: isFetchingProfiles } = useGetProfiles({
        managedUsersOnly,
    });
    const profilesList = useMemo(() => {
        if (!data) return [];
        return data.profiles.map(p => ({
            value: p.user_id,
            label: getDisplayName(p),
        }));
    }, [data]);
    const handleChange = useCallback(
        (newValue: string): void => {
            const fieldValue: number[] | undefined = newValue
                ? newValue.split(',').map(val => parseInt(val, 10))
                : undefined;
            if (field && form) {
                form.setFieldValue(field.name, fieldValue);
            }
        },
        [field, form],
    );
    return (
        <Select
            {...props}
            {...field}
            keyValue={field?.name}
            label={label}
            required
            loading={isFetchingProfiles}
            clearable={false}
            multi
            value={value}
            options={profilesList}
            onChange={handleChange}
            renderTags={(tagValue, getTagProps) =>
                tagValue.map((option, index) => {
                    const tagProps = getTagProps({
                        index,
                    });
                    const isCurrentUser = option.value === currentUser.user_id;
                    // disable delete for current user
                    tagProps.onDelete = isCurrentUser
                        ? undefined
                        : tagProps.onDelete;
                    return (
                        <Chip
                            disabled
                            color={isCurrentUser ? 'primary' : 'secondary'}
                            label={option?.label ? option.label : ''}
                            {...tagProps}
                        />
                    );
                })
            }
        />
    );
};
