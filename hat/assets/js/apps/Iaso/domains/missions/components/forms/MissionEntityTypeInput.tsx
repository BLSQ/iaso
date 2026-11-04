import React from 'react';
import { FormikProps } from 'formik/dist/types';
import {
    MissionEntityTypeCreateRequest,
    MissionEntityTypeUpdateRequest,
    MissionTypeDa2Enum,
} from 'Iaso/api/missions';
import { useGetEntityTypesDropdown } from 'Iaso/domains/entities/hooks/requests';
import { MissionCreatedTypeInput } from './MissionCreatedTypeInput';

type Props<TSchema> = {
    formik: FormikProps<TSchema>;
};

export const MissionEntityTypeInput = <
    TSchema extends
        | MissionEntityTypeUpdateRequest
        | MissionEntityTypeCreateRequest,
>({
    formik,
}: Props<TSchema>) => {
    const { data: entityTypesOptions, isLoading } = useGetEntityTypesDropdown();

    return (
        <MissionCreatedTypeInput
            missionType={MissionTypeDa2Enum.enum.ENTITY_AND_FORM}
            formik={formik}
            typeOptions={entityTypesOptions}
            isLoadingTypeOptions={isLoading}
        />
    );
};
