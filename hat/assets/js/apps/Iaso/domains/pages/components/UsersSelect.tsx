/* eslint-disable react/jsx-props-no-spreading */
import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { FormikProps, FieldInputProps } from 'formik';
// @ts-ignore
import { Select } from 'bluesquare-components';
import { Chip } from '@material-ui/core';

import getDisplayName, { useCurrentUser } from '../../../utils/usersUtils';
import { useGetProfiles } from '../../users/hooks/useGetProfiles';

type FormValues = {
    users: string;
};

type Props = {
    field?: FieldInputProps<number[]>;
    form?: FormikProps<FormValues>;
    label?: string;
};

export const UsersSelect: FunctionComponent<Props> = ({
    field,
    form,
    label = '',
    ...props
} = {}) => {
    const currentUser = useCurrentUser();
    const value = useMemo(() => {
        if (field?.value) {
            const arrayValue = field.value;
            if (!arrayValue.includes(currentUser.user_id)) {
                arrayValue.push(currentUser.user_id);
            }
            return arrayValue.join(',');
        }
        return [currentUser.user_id];
    }, [currentUser.user_id, field?.value]);
    const { data, isFetching: isFetchingProfiles } = useGetProfiles();
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
                // Disable delete of current user chip
                if (fieldValue?.includes(currentUser.user_id)) {
                    form.setFieldValue(field.name, fieldValue);
                }
            }
        },
        [currentUser.user_id, field, form],
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
