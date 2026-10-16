import React from 'react';
import { Grid } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { Field } from 'formik';
import { FormikProps } from 'formik/dist/types';
import {
    MissionEntityTypeUpdateRequest,
    MissionEntityTypeCreateRequest,
} from 'Iaso/api/missions';
import { NumberInput } from 'Iaso/components/forms/NumberInput';
import { SelectInput } from 'Iaso/components/forms/SelectInput';
import { useGetEntityTypesDropdown } from 'Iaso/domains/entities/hooks/requests';
import { UseGetFormsDropdownParams } from 'Iaso/domains/forms/hooks/useGetFormsDropdownOptions';
import { MissionFormsBaseInput } from 'Iaso/domains/missions/components/forms/MissionFormsBaseInput';
import MESSAGES from '../../messages';

type MissionEntityTypeInputProps<TSchema> = {
    formik: FormikProps<TSchema>;
};

export const MissionEntityTypeInput = <
    TSchema extends
        | MissionEntityTypeUpdateRequest
        | MissionEntityTypeCreateRequest,
>({
    formik,
}: MissionEntityTypeInputProps<TSchema>) => {
    const [params, setParams] = React.useState<UseGetFormsDropdownParams>();
    const [formInputDisabled, setFormInputDisabled] =
        React.useState<boolean>(false);
    const { data: entityTypesOptions, isLoading: isLoadingEntityTypeOptions } =
        useGetEntityTypesDropdown();

    const { formatMessage } = useSafeIntl();

    const { values } = formik;

    React.useEffect(() => {
        setFormInputDisabled(!values?.entity_type);
    }, [values]);

    React.useEffect(() => {
        if (values?.entity_type) {
            setParams({ params: { entity_type_ids: values?.entity_type } });
        } else {
            setParams({});
        }
    }, [values?.entity_type]);

    const handleEntityTypeChange = (_keyValue: string, _value: number) => {
        formik.setFieldValue('forms', []);
        formik.setFieldTouched('forms', false);
    };

    return (
        <>
            <Field
                name={'entity_type'}
                label={formatMessage(MESSAGES.entityType)}
                required
                clearable
                component={SelectInput}
                options={entityTypesOptions}
                loading={isLoadingEntityTypeOptions}
                onChange={handleEntityTypeChange}
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
                        ? formatMessage(MESSAGES.pleaseSelectEntityType)
                        : undefined,
                }}
            />
        </>
    );
};
