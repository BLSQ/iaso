import React, { useMemo } from 'react';
import { FormikProps } from 'formik/dist/types';
import {
    MissionOrgUnitTypeCreateRequest,
    MissionOrgUnitTypeUpdateRequest,
    MissionTypeDa2Enum,
} from 'Iaso/api/missions';
import { useGetOrgUnitTypesDropdownOptions } from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';
import { MissionCreatedTypeInput } from './MissionCreatedTypeInput';

type Props<TSchema> = {
    formik: FormikProps<TSchema>;
};

export const MissionOrgUnitTypeInput = <
    TSchema extends
        | MissionOrgUnitTypeUpdateRequest
        | MissionOrgUnitTypeCreateRequest,
>({
    formik,
}: Props<TSchema>) => {
    const { data: orgUnitTypes, isLoading } =
        useGetOrgUnitTypesDropdownOptions();
    const orgUnitTypesOptions = useMemo(
        () =>
            orgUnitTypes?.map(e => ({
                ...e,
                value: parseInt(e.value),
            })),
        [orgUnitTypes],
    );

    return (
        <MissionCreatedTypeInput
            missionType={MissionTypeDa2Enum.enum.ORG_UNIT_AND_FORM}
            formik={formik}
            typeOptions={orgUnitTypesOptions}
            isLoadingTypeOptions={isLoading}
        />
    );
};
