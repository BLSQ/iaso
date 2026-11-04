import React, { useCallback } from 'react';
import { DropdownOptions, useSafeIntl } from 'bluesquare-components';
import { FormikProps } from 'formik/dist/types';
import {
    MissionEntityTypeCreateRequest,
    MissionEntityTypeUpdateRequest,
    MissionOrgUnitTypeCreateRequest,
    MissionOrgUnitTypeUpdateRequest,
} from 'Iaso/api/missions';
import { MissionFormsBaseInput } from 'Iaso/domains/missions/components/forms/MissionFormsBaseInput';
import {
    CREATED_TYPE_CONFIG,
    CreatedTypeMissionType,
} from '../missionTypeOptions';
import { MissionCreatedTypeStep } from './MissionCreatedTypeStep';

type Props<TSchema> = {
    missionType: CreatedTypeMissionType;
    formik: FormikProps<TSchema>;
    typeOptions?: DropdownOptions<number>[];
    isLoadingTypeOptions: boolean;
};

export const MissionCreatedTypeInput = <
    TSchema extends
        | MissionOrgUnitTypeCreateRequest
        | MissionOrgUnitTypeUpdateRequest
        | MissionEntityTypeCreateRequest
        | MissionEntityTypeUpdateRequest,
>({
    missionType,
    formik,
    typeOptions,
    isLoadingTypeOptions,
}: Props<TSchema>) => {
    const { formatMessage } = useSafeIntl();
    const { setFieldValue, setFieldTouched } = formik;
    const { fieldName, getFormsParams, pleaseSelectMessage } =
        CREATED_TYPE_CONFIG[missionType];
    const typeId = (formik.values as Record<string, unknown>)[fieldName] as
        | number
        | undefined;
    const formInputDisabled = !typeId;

    const handleTypeChange = useCallback(() => {
        setFieldValue('forms', []);
        setFieldTouched('forms', false);
    }, [setFieldValue, setFieldTouched]);

    return (
        <>
            <MissionCreatedTypeStep
                missionType={missionType}
                step={1}
                typeOptions={typeOptions}
                isLoadingTypeOptions={isLoadingTypeOptions}
                onTypeChange={handleTypeChange}
            />
            <MissionFormsBaseInput
                missionType={missionType}
                step={2}
                params={typeId ? getFormsParams(typeId) : {}}
                formik={formik}
                formSelectProps={{
                    disabled: formInputDisabled,
                    helperText: formInputDisabled
                        ? formatMessage(pleaseSelectMessage)
                        : undefined,
                }}
            />
        </>
    );
};
