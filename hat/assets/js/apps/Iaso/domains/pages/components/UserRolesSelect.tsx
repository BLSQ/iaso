import React, { FunctionComponent, useCallback } from 'react';
import { Select } from 'bluesquare-components';
import { FieldInputProps, FormikProps } from 'formik';

import { commaSeparatedIdsToArray } from '../../../utils/forms';
import { useGetUserRolesDropDown } from '../../userRoles/hooks/requests/useGetUserRoles';

type FormValues = {
    user_roles: string;
};

type Props = {
    field?: FieldInputProps<number[]>;
    form?: FormikProps<FormValues>;
    label?: string;
};

export const UserRolesSelect: FunctionComponent<Props> = ({
    field,
    form,
    label = '',
    ...props
} = {}) => {
    const { data: userRoles, isFetching: isFetchingRoles } =
        useGetUserRolesDropDown();

    const handleChange = useCallback(
        (newValue: string): void => {
            const fieldValue: number[] = commaSeparatedIdsToArray(newValue);
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
            loading={isFetchingRoles}
            clearable
            multi
            value={field?.value || []}
            options={userRoles || []}
            onChange={handleChange}
        />
    );
};
