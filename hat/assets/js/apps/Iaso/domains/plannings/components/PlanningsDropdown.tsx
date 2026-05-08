import React, { FunctionComponent } from 'react';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { userHasOneOfPermissions } from 'Iaso/domains/users/utils';
import { PLANNING_READ, PLANNING_WRITE } from 'Iaso/utils/permissions';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import { useGetPlanningsOptions } from '../hooks/requests/useGetPlannings';
import MESSAGES from '../messages';

type Props = {
    multi?: boolean;
    handleChange: (keyValue: string, value: any) => void;
    value: any;
    formIds?: string;
    keyValue: string;
};

export const PlanningsDropdown: FunctionComponent<Props> = ({
    multi = false,
    handleChange,
    value,
    formIds,
    keyValue,
}) => {
    const currentUser = useCurrentUser();
    const hasPermissions = userHasOneOfPermissions(
        [PLANNING_READ, PLANNING_WRITE],
        currentUser,
    );
    const { data: availablePlannings, isFetching: fetchingPlannings } =
        useGetPlanningsOptions(formIds, hasPermissions);

    return hasPermissions ? (
        <InputComponent
            type="select"
            onChange={(_key, value: any) => handleChange(keyValue, value)}
            keyValue={keyValue}
            label={MESSAGES.planning}
            value={value}
            multi={multi}
            loading={fetchingPlannings}
            options={availablePlannings ?? []}
        />
    ) : null;
};
