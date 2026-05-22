import React, { useCallback, useMemo } from 'react';
import { Chip } from '@mui/material';
import { AutocompleteRenderGetTagProps } from '@mui/material/Autocomplete/Autocomplete';
import { FieldInputProps, FormikProps } from 'formik';

import { UserAsyncSelect } from 'Iaso/components/filters/UserAsyncSelect';
import { DropdownOptions } from 'Iaso/types/utils';
import { useCurrentUser } from 'Iaso/utils/usersUtils';

import MESSAGES from '../messages';

type FormValues = {
    users: string;
};

type Props = {
    field?: FieldInputProps<number[]>;
    form?: FormikProps<FormValues>;
    label?: string;
    isNewPage?: boolean;
};

export const UsersSelect = ({
    field,
    form,
    label: _label,
    isNewPage = false,
    ...props
}: Props = {}) => {
    const currentUser = useCurrentUser();

    const rawFieldIds = field?.value;
    const effectiveUserIds = useMemo(() => {
        if (isNewPage && (!rawFieldIds || rawFieldIds.length === 0)) {
            return [currentUser.user_id];
        }
        return rawFieldIds ?? [];
    }, [currentUser.user_id, isNewPage, rawFieldIds]);

    const filterUsers = useMemo(
        () =>
            effectiveUserIds.length > 0
                ? effectiveUserIds.join(',')
                : undefined,
        [effectiveUserIds],
    );

    const handleChange = useCallback(
        (_keyValue: string, val: unknown) => {
            const fieldValue: number[] = val
                ? String(val)
                      .split(',')
                      .map(v => parseInt(v, 10))
                      .filter(n => !Number.isNaN(n))
                : [];
            if (field && form) {
                form.setFieldValue(field.name, fieldValue);
                form.setFieldTouched(field.name, true);
            }
        },
        [field, form],
    );

    const renderTags = useCallback(
        (
            tagValue: DropdownOptions<number>[],
            getTagProps: AutocompleteRenderGetTagProps,
        ) =>
            tagValue.map((option, index: number) => {
                const tagProps = getTagProps({
                    index,
                });
                const { onDelete, ...restTagProps } = tagProps;
                const isCurrentUser = option.value === currentUser.user_id;
                return (
                    <Chip
                        {...restTagProps}
                        key={String(option?.value ?? option?.label ?? index)}
                        disabled={isCurrentUser}
                        color={isCurrentUser ? 'primary' : 'secondary'}
                        label={option?.label ? option.label : ''}
                        {...(!isCurrentUser ? { onDelete } : {})}
                    />
                );
            }),
        [currentUser.user_id],
    );

    return (
        <UserAsyncSelect
            handleChange={handleChange}
            filterUsers={filterUsers}
            additionalFilters={{ managedUsersOnly: 'true' }}
            keyValue={field?.name ?? 'users'}
            label={MESSAGES.users}
            multi
            renderTags={renderTags}
            required
            {...props}
        />
    );
};
