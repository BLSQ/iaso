import React from 'react';
import moment from 'moment';
import {
    ApiModulesDropdownListParams,
    getApiModulesDropdownListQueryKey,
    useApiModulesDropdownList,
} from 'Iaso/api/modules';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { userHasOneOfPermissions } from 'Iaso/domains/users/utils';
import { MODULES } from 'Iaso/utils/permissions';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
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
    const currentUser = useCurrentUser();
    const hasPermissions = userHasOneOfPermissions([MODULES], currentUser);

    // todo: queryKey def could maybe be more generic at orval config level?
    const { data, isLoading } = useApiModulesDropdownList(params, {
        query: {
            enabled: hasPermissions,
            snackErrorMsg: MESSAGES.modulesDropDownError,
            queryKey: [
                ...getApiModulesDropdownListQueryKey(params),
                moment().locale(),
            ],
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
