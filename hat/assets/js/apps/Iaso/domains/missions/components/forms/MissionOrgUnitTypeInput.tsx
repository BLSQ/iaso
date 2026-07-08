import React from 'react';
import AddIcon from '@mui/icons-material/Add';
import { Box, Button, Grid, Typography } from '@mui/material';
import { Select, useSafeIntl } from 'bluesquare-components';
import { Field, FieldArray, useFormikContext } from 'formik';
import { MissionFormCreateTypedRequest } from 'Iaso/api/missions';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { useGetFormsDropdownOptions } from 'Iaso/domains/forms/hooks/useGetFormsDropdownOptions';
import { useGetOrgUnitTypesDropdownOptions } from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';
import MESSAGES from '../../messages';

export const MissionOrgUnitTypeInput = () => {
    const { data: formsOptions, isLoading } = useGetFormsDropdownOptions();
    // eslint-disable-next-line
    const { data: orgUnitTypeOptions, isLoading: orgUnitTypeIsLoading } =
        useGetOrgUnitTypesDropdownOptions();
    const { formatMessage } = useSafeIntl();
    const [formOption, setFormOption] = React.useState();
    const { values } = useFormikContext<MissionFormCreateTypedRequest>();

    return (
        <>
            <FieldArray
                name="forms"
                render={arrayHelpers => (
                    <Box>
                        <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                            <Select
                                loading={isLoading}
                                options={formsOptions}
                                label={formatMessage(MESSAGES.addForm)}
                                clearable
                                value={formOption}
                                keyValue={''}
                                onChange={value => setFormOption(value)}
                            />
                            <Button
                                size={'small'}
                                color={'success'}
                                variant={'contained'}
                                onClick={() =>
                                    arrayHelpers.push({
                                        form: formOption,
                                        min_cardinality: 1,
                                        max_cardinality: undefined,
                                    })
                                }
                                aria-label={formatMessage(MESSAGES.addForm)}
                            >
                                <AddIcon />
                            </Button>
                        </Box>
                        {values.forms &&
                            values.forms.length > 0 &&
                            values.forms.map((form, index) => (
                                <Grid
                                    container
                                    spacing={2}
                                    // as we cannot be sure that form.form will be unique, it's ok to silence it there
                                    // eslint-disable-next-line react/no-array-index-key
                                    key={`forms-${form.form}-${index}`}
                                >
                                    <Grid item xs={12}>
                                        <Typography>
                                            {
                                                formsOptions?.filter(
                                                    ({ value }) =>
                                                        value === form.form,
                                                )?.[0]?.label
                                            }
                                        </Typography>
                                    </Grid>
                                    <Field
                                        name={`forms.${index}.min_cardinality`}
                                        type={'hidden'}
                                        value={form.form}
                                    />
                                    <Grid item xs={12} sm={6}>
                                        <Field
                                            label={MESSAGES.minCardinality}
                                            name={`forms.${index}.min_cardinality`}
                                            initialValue={1}
                                            min={0}
                                            type={'number'}
                                            component={InputComponent}
                                            required
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Field
                                            label={MESSAGES.maxCardinality}
                                            name={`forms.${index}.max_cardinality`}
                                            initialValue={1}
                                            type={'number'}
                                            min={0}
                                            component={InputComponent}
                                        />
                                    </Grid>
                                </Grid>
                            ))}
                    </Box>
                )}
            />
        </>
    );
};
