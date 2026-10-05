import React from 'react';
import {
    ApiModulesDropdownListParams,
    useApiModulesDropdownList,
} from 'Iaso/api/modules';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { useCurrentUserHasOneOfPermissions } from 'Iaso/domains/users/utils';
import { ACCOUNT_MANAGEMENT, MODULES } from 'Iaso/utils/permissions';
import MESSAGES from '../messages';
export type ModulesDropdownProps = {
    params?: ApiModulesDropdownListParams;
    handleChange?: (keyValue: string, value: string | number) => void;
} & Omit<
    React.ComponentProps<typeof InputComponent>,
    'loading' | 'options' | 'type'
>;

export const ModulesDropdown = ({
    params,
    handleChange,
    label,
    ...props
}: ModulesDropdownProps) => {
    const hasPermissions = useCurrentUserHasOneOfPermissions([
        MODULES,
        ACCOUNT_MANAGEMENT,
    ]);

    const { data, isLoading } = useApiModulesDropdownList(params, {
        query: {
            meta: {
                snackErrorMsg: MESSAGES.modulesDropDownError,
            },
            enabled: hasPermissions,
        },
    });

    return hasPermissions ? (
        <InputComponent
            type="select"
            onChange={(_key, value: any) =>
                handleChange && handleChange(_key, value)
            }
            label={label ?? MESSAGES.dropdownLabel}
            loading={isLoading}
            options={data ?? []}
            {...props}
        />
    ) : null;
};
