import React from 'react';
import { Grid } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { Field, useFormikContext } from 'formik';
import { NumberInput } from 'Iaso/components/forms/NumberInput';
import { SelectInput } from 'Iaso/components/forms/SelectInput';
import { useGetEntityTypesDropdown } from 'Iaso/domains/entities/hooks/requests';
import { UseGetFormsDropdownParams } from 'Iaso/domains/forms/hooks/useGetFormsDropdownOptions';
import { MissionFormsBaseInput } from 'Iaso/domains/missions/components/forms/MissionFormsBaseInput';
import { MissionCreateBody } from 'Iaso/domains/missions/schemas/create';
import MESSAGES from '../../messages';

export const MissionEntityTypeInput = () => {
    const [params, setParams] = React.useState<UseGetFormsDropdownParams>();

    const { data: entityTypesOptions, isLoading: isLoadingEntityTypeOptions } =
        useGetEntityTypesDropdown();

    const { formatMessage } = useSafeIntl();
    const formik = useFormikContext<MissionCreateBody>();

    const handleEntityTypeChange = (_keyValue: string, value: number) => {
        if (value) {
            setParams({ params: { entity_type_ids: value } });
        }

        formik.setFieldValue('forms', []);
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
            <Grid container spacing={2} sx={{ mt: 2 }}>
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

            <MissionFormsBaseInput params={params} />
        </>
    );
};
