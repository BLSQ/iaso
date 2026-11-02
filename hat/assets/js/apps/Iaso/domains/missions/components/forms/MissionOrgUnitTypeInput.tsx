import React from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { FormikProps } from 'formik/dist/types';
import {
    MissionOrgUnitTypeCreateRequest,
    MissionOrgUnitTypeUpdateRequest,
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
                title={formatMessage(MESSAGES.orgUnitsAgentCreates)}
                description={formatMessage(MESSAGES.orgUnitsAgentCreatesInfo)}
                typeFieldName="org_unit_type"
                typeLabel={formatMessage(MESSAGES.orgUnitTypeToCreate)}
                typeOptions={orgUnitTypesOptions}
                isLoadingTypeOptions={isLoadingOrgUnitTypeOptions}
                onTypeChange={handleOrgUnitTypeChange}
                minLabel={formatMessage(MESSAGES.minNewOrgUnits)}
                maxLabel={formatMessage(MESSAGES.maxNewOrgUnits)}
            />
            <MissionFormsBaseInput
                step={2}
                title={formatMessage(MESSAGES.formsOnCreatedOrgUnit)}
                description={formatMessage(MESSAGES.formsOnCreatedOrgUnitInfo)}
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
