import React, { FunctionComponent } from 'react';
import { Box, Grid, Typography, makeStyles } from '@material-ui/core';
import { Field, useFormikContext } from 'formik';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { SingleSelect } from '../../../../../components/Inputs/SingleSelect';
import { MultiSelect } from '../../../../../components/Inputs/MultiSelect';
import { DateInput } from '../../../../../components/Inputs/DateInput';
import { NumberInput } from '../../../../../components/Inputs';
import { TextArea } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/forms/TextArea';

type Props = { className?: string };
const useStyles = makeStyles(theme => ({ ...commonStyles(theme) }));

export const VaccineRequestForm: FunctionComponent<Props> = ({ className }) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const { values, touched, errors, setFieldValue } = useFormikContext<any>();
    console.log('values', values, !values.country);
    // Get VRF if VRF id
    // If VRF set form values
    return (
        <>
            <Box mb={2}>
                <Typography variant="h5">Vaccine request form</Typography>
            </Box>
            <Grid container spacing={2}>
                <Grid container item xs={12} spacing={2}>
                    <Grid item xs={6} md={3}>
                        <Field
                            label="Country"
                            name="country.name"
                            component={SingleSelect}
                            disabled={false}
                            required
                        />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <Field
                            label="Campaign"
                            name="obr_name"
                            component={SingleSelect}
                            disabled={!values.country}
                            required
                        />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <Field
                            label="Vaccine type"
                            name="vaccine_type"
                            component={SingleSelect}
                            disabled={!values.obr_name}
                            required
                        />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        {/* TODO handle values */}
                        <Field
                            label="Rounds"
                            name="rounds"
                            component={MultiSelect}
                            disabled={!values.vaccine_type}
                            required
                        />
                    </Grid>
                </Grid>
                <Grid container item xs={12} spacing={2}>
                    <Grid item xs={6} md={3}>
                        <Box mt={2}>
                            <Field
                                label="Date of VRF signature"
                                name="date_vrf_signature"
                                component={DateInput}
                                disabled={false}
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <Box mt={2}>
                            <Field
                                label="Quantity ordered in doses"
                                name="quantity_ordered"
                                component={NumberInput}
                                disabled={false}
                            />
                        </Box>
                    </Grid>

                    <Grid item xs={6} md={3}>
                        <Box mt={2}>
                            <Field
                                label="Wastage ratio"
                                name="wastage_ratio"
                                component={NumberInput}
                                disabled={false}
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <Box mt={2}>
                            <Field
                                label="Date of VRF reception"
                                name="date_vrf_reception"
                                component={DateInput}
                                disabled={false}
                            />
                        </Box>
                    </Grid>
                </Grid>
                <Grid container item xs={12} spacing={2}>
                    <Grid item xs={6} md={3}>
                        <Field
                            label="Date of VRF submission ORPG"
                            name="date_vrf_submission_orpg"
                            component={DateInput}
                            disabled={false}
                        />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <Field
                            label="Quantity approved by ORPG in doses"
                            name="quantity_approved_orpg"
                            component={NumberInput}
                            disabled={false}
                        />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <Field
                            label="Date of RRT/ORPG approval"
                            name="date_orpg_approval"
                            component={DateInput}
                            disabled={false}
                        />
                    </Grid>
                </Grid>
                <Grid container item xs={12} spacing={2}>
                    <Grid item xs={6} md={3}>
                        <Field
                            label="Date of VRF submission to DG"
                            name="date_vrf_submission_dg"
                            component={DateInput}
                            disabled={false}
                        />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <Field
                            label="Quantity approved by DG in doses"
                            name="quantity_approved_dg"
                            component={NumberInput}
                            disabled={false}
                        />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <Field
                            label="Date of DG approval"
                            name="date_dg_approval"
                            component={DateInput}
                            disabled={false}
                        />
                    </Grid>
                </Grid>
                <Grid container item xs={12} md={9} lg={6} spacing={1}>
                    <Grid item xs={12}>
                        <TextArea
                            value={values.comment}
                            // errors={getErrors('comment')}
                            label="Comments"
                            onChange={() => null}
                            // required={requiredFields.includes('comment')}
                            debounceTime={0}
                        />
                    </Grid>
                </Grid>
            </Grid>
        </>
    );
};
