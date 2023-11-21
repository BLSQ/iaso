import React, { FunctionComponent, useCallback } from 'react';
import { Box, Grid, Typography } from '@material-ui/core';
import { Field, useFormikContext } from 'formik';
import { useSafeIntl, useSkipEffectOnMount } from 'bluesquare-components';
import { SingleSelect } from '../../../../../components/Inputs/SingleSelect';
import { MultiSelect } from '../../../../../components/Inputs/MultiSelect';
import { DateInput } from '../../../../../components/Inputs/DateInput';
import { NumberInput } from '../../../../../components/Inputs';
import { TextArea } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/forms/TextArea';

import MESSAGES from '../../messages';
import {
    useCampaignDropDowns,
    useGetCountriesOptions,
} from '../../hooks/api/vrf';
import { useSharedStyles } from '../shared';

type Props = { className?: string; vrfData: any };

export const VaccineRequestForm: FunctionComponent<Props> = ({
    className,
    vrfData,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useSharedStyles();
    const { data: countriesOptions, isFetching: isFetchingCountries } =
        useGetCountriesOptions();
    const vrfDataComment = vrfData?.comment;
    const { values, setFieldTouched, setFieldValue } = useFormikContext<any>();
    const {
        campaigns,
        vaccines,
        rounds,
        isFetching: isFetchingDropDowns,
    } = useCampaignDropDowns(
        values?.vrf?.country,
        values?.vrf?.campaign,
        values?.vrf?.vaccine_type,
    );

    const onCommentChange = useCallback(
        value => {
            // this condition is to avoid marking the field as touched when setting the value to the API response
            if (
                values?.vrf?.comment !== undefined &&
                values?.vrf?.comment !== vrfDataComment
            ) {
                setFieldTouched('vrf.comment', true);
            }
            setFieldValue('vrf.comment', value);
        },
        [setFieldTouched, setFieldValue, values?.vrf?.comment, vrfDataComment],
    );

    // These need to be handled via useEffect because doing it in a custom onChange function
    // will cause the validation to be out of sync with the form state
    // Skipping the effect onmount to avoid clearing existing values from the fields
    useSkipEffectOnMount(() => {
        setFieldValue('vrf.campaign', undefined);
        setFieldValue('vrf.vaccine_type', undefined);
        setFieldValue('vrf.rounds', undefined);
    }, [setFieldValue, values?.vrf?.country]);

    useSkipEffectOnMount(() => {
        setFieldValue('vrf.vaccine_type', undefined);
        setFieldValue('vrf.rounds', undefined);
    }, [setFieldValue, values?.vrf?.campaign]);

    useSkipEffectOnMount(() => {
        setFieldValue('vrf.rounds', undefined);
    }, [setFieldValue, values?.vrf?.vaccine_type]);

    return (
        <Box className={className} mb={3}>
            <Box mb={2}>
                <Typography variant="h5">
                    {formatMessage(MESSAGES.vrfTitle)}
                </Typography>
            </Box>
            <Box className={classes.scrollableForm}>
                <Grid container>
                    <Grid container item xs={12} spacing={2}>
                        <Grid item xs={6} md={3}>
                            <Field
                                label={formatMessage(MESSAGES.country)}
                                name="vrf.country"
                                component={SingleSelect}
                                disabled={false}
                                required
                                withMarginTop
                                isLoading={
                                    isFetchingCountries || isFetchingDropDowns
                                }
                                options={countriesOptions}
                            />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Field
                                label={formatMessage(MESSAGES.campaign)}
                                name="vrf.campaign"
                                component={SingleSelect}
                                disabled={!values?.vrf?.country}
                                required
                                options={campaigns}
                                withMarginTop
                                isLoading={
                                    isFetchingCountries || isFetchingDropDowns
                                }
                            />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Field
                                label={formatMessage(MESSAGES.vaccine)}
                                name="vrf.vaccine_type"
                                component={SingleSelect}
                                disabled={!values?.vrf?.campaign}
                                required
                                options={vaccines}
                                withMarginTop
                                isLoading={
                                    isFetchingCountries || isFetchingDropDowns
                                }
                            />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Field
                                label={formatMessage(MESSAGES.rounds)}
                                name="vrf.rounds"
                                component={MultiSelect}
                                disabled={!values?.vrf?.vaccine_type}
                                required
                                withMarginTop
                                options={rounds}
                                isLoading={
                                    isFetchingCountries || isFetchingDropDowns
                                }
                            />
                        </Grid>
                    </Grid>
                    <Grid container item xs={12} spacing={2}>
                        <Grid item xs={6} md={3}>
                            <Box mt={2}>
                                <Field
                                    label={formatMessage(
                                        MESSAGES.date_vrf_signature,
                                    )}
                                    name="vrf.date_vrf_signature"
                                    component={DateInput}
                                    disabled={false}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Box mt={2}>
                                <Field
                                    label={formatMessage(
                                        MESSAGES.quantities_ordered_in_doses,
                                    )}
                                    name="vrf.quantities_ordered_in_doses"
                                    component={NumberInput}
                                    disabled={false}
                                />
                            </Box>
                        </Grid>

                        <Grid item xs={6} md={3}>
                            <Box mt={2}>
                                <Field
                                    label={formatMessage(MESSAGES.wastageRatio)}
                                    name="vrf.wastage_rate_used_on_vrf"
                                    component={NumberInput}
                                    disabled={false}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Box mt={2}>
                                <Field
                                    label={formatMessage(
                                        MESSAGES.date_vrf_reception,
                                    )}
                                    name="vrf.date_vrf_reception"
                                    component={DateInput}
                                    disabled={false}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                    <Grid container item xs={12} spacing={2}>
                        <Grid item xs={6} md={3}>
                            <Field
                                label={formatMessage(
                                    MESSAGES.date_vrf_submission_to_orpg,
                                )}
                                name="vrf.date_vrf_submission_to_orpg"
                                component={DateInput}
                                disabled={false}
                            />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Field
                                label={formatMessage(
                                    MESSAGES.quantities_approved_by_orpg_in_doses,
                                )}
                                name="vrf.quantities_approved_by_orpg_in_doses"
                                component={NumberInput}
                                disabled={false}
                            />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Field
                                label={formatMessage(
                                    MESSAGES.date_rrt_orpg_approval,
                                )}
                                name="vrf.date_rrt_orpg_approval"
                                component={DateInput}
                                disabled={false}
                            />
                        </Grid>
                    </Grid>
                    <Grid container item xs={12} spacing={2}>
                        <Grid item xs={6} md={3}>
                            <Field
                                label={formatMessage(
                                    MESSAGES.date_vrf_submission_dg,
                                )}
                                name="vrf.date_vrf_submitted_to_dg"
                                component={DateInput}
                                disabled={false}
                            />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Field
                                label={formatMessage(
                                    MESSAGES.quantities_approved_by_dg_in_doses,
                                )}
                                name="vrf.quantities_approved_by_dg_in_doses"
                                component={NumberInput}
                                disabled={false}
                            />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Field
                                label={formatMessage(MESSAGES.date_dg_approval)}
                                name="vrf.date_dg_approval"
                                component={DateInput}
                                disabled={false}
                            />
                        </Grid>
                    </Grid>
                    <Grid container item xs={12} md={9} lg={6} spacing={2}>
                        <Grid item xs={12}>
                            <TextArea
                                value={values?.vrf?.comment ?? ''}
                                // errors={errors.comment ? errors.comment : []}
                                label={formatMessage(MESSAGES.comments)}
                                onChange={onCommentChange}
                                debounceTime={0}
                            />
                        </Grid>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
};
