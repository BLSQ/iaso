import React from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { FormikProps } from 'formik/dist/types';
import {
    MissionOrgUnitTypeCreateRequest,
    MissionOrgUnitTypeUpdateRequest,
    MissionTypeDa2Enum,
} from 'Iaso/api/missions';
import { UseGetFormsDropdownParams } from 'Iaso/domains/forms/hooks/useGetFormsDropdownOptions';
import { MissionFormsBaseInput } from 'Iaso/domains/missions/components/forms/MissionFormsBaseInput';
import { useGetOrgUnitTypesDropdownOptions } from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';
import MESSAGES from '../../messages';
import { MissionCreatedTypeStep } from './MissionCreatedTypeStep';

type MissionOrgUnitTypeInputProps<TSchema> = {
    formik: FormikProps<TSchema>;
};

export const MissionOrgUnitTypeInput = <
    TSchema extends
        | MissionOrgUnitTypeUpdateRequest
        | MissionOrgUnitTypeCreateRequest,
>({
    formik,
}: MissionOrgUnitTypeInputProps<TSchema>) => {
    const [params, setParams] = React.useState<UseGetFormsDropdownParams>();
    const [formInputDisabled, setFormInputDisabled] =
        React.useState<boolean>(false);

    const { data: orgUnitTypes, isLoading: isLoadingOrgUnitTypeOptions } =
        useGetOrgUnitTypesDropdownOptions();

    const orgUnitTypesOptions = orgUnitTypes?.map(e => ({
        ...e,
        value: parseInt(e.value),
    }));

    const { formatMessage } = useSafeIntl();

    const { values } = formik;

    React.useEffect(() => {
        if (values?.org_unit_type) {
            setParams({ params: { orgUnitTypeIds: values?.org_unit_type } });
        } else {
            setParams({});
        }
    }, [values?.org_unit_type]);

    React.useEffect(() => {
        setFormInputDisabled(!values?.org_unit_type);
    }, [values]);

    const handleOrgUnitTypeChange = (_keyValue: string, _value: number) => {
        formik.setFieldValue('forms', []);
        formik.setFieldTouched('forms', false);
    };

    return (
        <>
            <MissionCreatedTypeStep
                missionType={MissionTypeDa2Enum.enum.ORG_UNIT_AND_FORM}
                typeOptions={orgUnitTypesOptions}
                isLoadingTypeOptions={isLoadingOrgUnitTypeOptions}
                onTypeChange={handleOrgUnitTypeChange}
            />
            <MissionFormsBaseInput
                missionType={MissionTypeDa2Enum.enum.ORG_UNIT_AND_FORM}
                step={2}
                params={params}
                formik={formik}
                formSelectProps={{
                    disabled: formInputDisabled,
                    helperText: formInputDisabled
                        ? formatMessage(MESSAGES.pleaseSelectOrgUnitType)
                        : undefined,
                }}
            />
        </>
    );
};
