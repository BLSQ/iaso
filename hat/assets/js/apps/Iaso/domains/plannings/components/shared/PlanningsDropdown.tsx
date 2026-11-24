import React, { FunctionComponent } from 'react';
import { useApiMicroplanningPlanningsDropdownList } from 'Iaso/api/plannings/endpoints/micro-plannings/micro-plannings';
import { ApiMicroplanningPlanningsDropdownListParams } from 'Iaso/api/plannings/models/apiMicroplanningPlanningsDropdownListParams.zod';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { userHasPermission } from 'Iaso/domains/users/utils';
import { PLANNING_READ } from 'Iaso/utils/permissions';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import MESSAGES from '../../messages';

type PlanningsDropdownProps = {
    formIds?: ApiMicroplanningPlanningsDropdownListParams['form_ids'];
    handleChange?: (keyValue: string, value: any) => void;
} & Omit<
    React.ComponentProps<typeof InputComponent>,
    'loading' | 'options' | 'type'
>;

export const PlanningsDropdown: FunctionComponent<PlanningsDropdownProps> = ({
    handleChange,
    formIds,
    ...props
}) => {
    const currentUser = useCurrentUser();
    const hasPermissions = userHasPermission(PLANNING_READ, currentUser);
    const { data: availablePlannings, isFetching: fetchingPlannings } =
        useApiMicroplanningPlanningsDropdownList(
            formIds
                ? {
                      form_ids: formIds,
                  }
                : undefined,
            {
                query: {
                    enabled: hasPermissions,
                },
            },
        );

    return hasPermissions ? (
        <InputComponent
            type="select"
            onChange={(keyValue, value) => {
                if (handleChange) {
                    handleChange(keyValue, value);
                }
            }}
            label={MESSAGES.planning}
            loading={fetchingPlannings}
            options={availablePlannings ?? []}
            {...props}
        />
    ) : null;
};
