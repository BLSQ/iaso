import React from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { useApiMicroplanningMissionsMissionTypesDropdownList } from 'Iaso/api/missions';
import {
    SelectInput,
    SelectInputProps,
} from 'Iaso/components/forms/SelectInput';
import { userHasPermission } from 'Iaso/domains/users/utils';
import { MISSION_READ } from 'Iaso/utils/permissions';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import MESSAGES from '../messages';
export type MissionTypeDropdownInputProps<TSchema, TValues> = Omit<
    SelectInputProps<string, TSchema, TValues>,
    'options' | 'loading'
>;

export const MissionTypeDropdownInput = <TSchema, TValues>({
    label,
    ...props
}: MissionTypeDropdownInputProps<TSchema, TValues>) => {
    const currentUser = useCurrentUser();
    const hasPermission = userHasPermission(MISSION_READ, currentUser);
    const { formatMessage } = useSafeIntl();

    const { data, isLoading } =
        useApiMicroplanningMissionsMissionTypesDropdownList({
            query: {
                enabled: hasPermission,
            },
        });

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
