import React from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { useApiMicroplanningMissionsDropdownList } from 'Iaso/api/missions/endpoints/missions/missions';
import { type ApiMicroplanningMissionsDropdownListParams } from 'Iaso/api/missions/models/apiMicroplanningMissionsDropdownListParams.zod';
import {
    SelectInput,
    SelectInputProps,
} from 'Iaso/components/forms/SelectInput';
import { userHasPermission } from 'Iaso/domains/users/utils';
import { MISSION_READ } from 'Iaso/utils/permissions';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import MESSAGES from '../messages';
export type MissionDropdownInputProps<TSchema, TValues> = Omit<
    SelectInputProps<string, TSchema, TValues>,
    'options' | 'loading'
> & {
    params?: ApiMicroplanningMissionsDropdownListParams;
};

export const MissionDropdownInput = <TSchema, TValues>({
    label,
    params,
    ...props
}: MissionDropdownInputProps<TSchema, TValues>) => {
    const currentUser = useCurrentUser();
    const hasPermission = userHasPermission(MISSION_READ, currentUser);
    const { formatMessage } = useSafeIntl();

    const { data, isLoading } = useApiMicroplanningMissionsDropdownList(
        params,
        {
            query: {
                enabled: hasPermission,
            },
        },
    );

    label = label ?? formatMessage(MESSAGES.missionType);
    return hasPermission ? (
        <SelectInput
            loading={isLoading}
            options={data ?? []}
            label={label}
            {...props}
        />
    ) : null;
};
