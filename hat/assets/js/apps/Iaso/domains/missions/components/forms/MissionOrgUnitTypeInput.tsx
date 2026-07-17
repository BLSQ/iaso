import React from 'react';
import { Grid } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { Field } from 'formik';
import { FormikProps } from 'formik/dist/types';
import {
    MissionOrgUnitTypeCreateRequest,
    MissionOrgUnitTypeUpdateRequest,
} from 'Iaso/api/missions';
import { NumberInput } from 'Iaso/components/forms/NumberInput';
import { SelectInput } from 'Iaso/components/forms/SelectInput';
import { UseGetFormsDropdownParams } from 'Iaso/domains/forms/hooks/useGetFormsDropdownOptions';
import { MissionFormsBaseInput } from 'Iaso/domains/missions/components/forms/MissionFormsBaseInput';
import { useGetOrgUnitTypesDropdownOptions } from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';
import MESSAGES from '../../messages';

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
            <Field
                name={'org_unit_type'}
                label={formatMessage(MESSAGES.orgUnitType)}
                required
                clearable
                component={SelectInput}
                options={orgUnitTypesOptions}
                loading={isLoadingOrgUnitTypeOptions}
                onChange={handleOrgUnitTypeChange}
            />
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <Field
                        label={formatMessage(MESSAGES.minCardinality)}
                        name={`min_cardinality`}
                        initialValue={1}
                        min={1}
                        component={NumberInput}
                        required
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Field
                        label={formatMessage(MESSAGES.maxCardinality)}
                        name={`max_cardinality`}
                        initialValue={1}
                        type={'number'}
                        min={0}
                        component={NumberInput}
                    />
                </Grid>
            </Grid>

            <MissionFormsBaseInput
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
