import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
} from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { Field, useFormikContext } from 'formik';
import DocumentUploadWithPreview from '../../../../../../../../../hat/assets/js/apps/Iaso/components/files/pdf/DocumentUploadWithPreview';
import { processErrorDocsBase } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/files/pdf/utils';
import InputComponent from '../../../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { NumberInput } from '../../../../../components/Inputs';
import { DateInput } from '../../../../../components/Inputs/DateInput';
import { MultiSelect } from '../../../../../components/Inputs/MultiSelect';
import { SingleSelect } from '../../../../../components/Inputs/SingleSelect';
import {
    renderRoundTag,
    useCampaignDropDowns,
    useGetCountriesOptions,
} from '../../hooks/api/vrf';
import { useSkipEffectUntilValue } from '../../hooks/utils';
import MESSAGES from '../../messages';
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

    const vrfTypeOptions = [
        { label: formatMessage(MESSAGES.vrfTypeNormal), value: 'Normal' },
        { label: formatMessage(MESSAGES.vrfTypeMissing), value: 'Missing' },
        {
            label: formatMessage(MESSAGES.vrfTypeNotRequired),
            value: 'Not Required',
        },
    ];

    const { values, setFieldTouched, setFieldValue, errors } =
        useFormikContext<any>();
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

    useEffect(() => {
        if (!values?.vrf?.vrf_type) {
            setFieldValue('vrf.vrf_type', 'Normal'); // Set your default value here
        }
    }, [setFieldValue, values?.vrf?.vrf_type]);

    const onCommentChange = useCallback(
        (_, value) => {
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

    const resetOnCountryChange = useCallback(() => {
        setFieldValue('vrf.campaign', undefined);
        setFieldValue('vrf.vaccine_type', undefined);
        setFieldValue('vrf.rounds', undefined);
    }, [setFieldValue]);
    const resetOnCampaignChange = useCallback(() => {
        setFieldValue('vrf.vaccine_type', undefined);
        setFieldValue('vrf.rounds', undefined);
    }, [setFieldValue]);
    const resetOnVaccineChange = useCallback(() => {
        setFieldValue('vrf.rounds', undefined);
    }, [setFieldValue]);

    useSkipEffectUntilValue(values?.vrf?.country, resetOnCountryChange);
    useSkipEffectUntilValue(values?.vrf?.campaign, resetOnCampaignChange);
    useSkipEffectUntilValue(values?.vrf?.vaccine_type, resetOnVaccineChange);

    const isNormalType = values?.vrf?.vrf_type === 'Normal';

    const documentErrors = useMemo(() => {
        return processErrorDocsBase(errors.document);
    }, [errors.document]);
    return (
        <Box className={className} mb={3}>
            <Box mb={2}>
                <Grid container alignItems="center" spacing={2}>
                    <Grid item xs={9}>
                        <Typography variant="h5">
                            {formatMessage(MESSAGES.vrfTitle)}
                        </Typography>
                    </Grid>
                    <Grid item xs={3}>
                        <Field
                            label={formatMessage(MESSAGES.vrfType)}
                            name="vrf.vrf_type"
                            component={SingleSelect}
                            disabled={!vrfData?.can_edit}
                            required
                            withMarginTop
                            isLoading={
                                isFetchingCountries || isFetchingDropDowns
                            }
                            options={vrfTypeOptions}
                        />
                    </Grid>
                </Grid>
            </Box>
            <Box className={classes.scrollableForm}>
                <Grid container>
                    <Grid container item xs={12} spacing={2}>
                        <Grid item xs={6} md={3}>
                            <Field
                                label={formatMessage(MESSAGES.country)}
                                name="vrf.country"
                                component={SingleSelect}
                                disabled={!vrfData?.can_edit}
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
                                disabled={
                                    !values?.vrf?.country || !vrfData?.can_edit
                                }
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
                                disabled={
                                    !values?.vrf?.campaign || !vrfData?.can_edit
                                }
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
                                label={formatMessage(MESSAGES.roundNumbers)}
                                name="vrf.rounds"
                                component={MultiSelect}
                                disabled={
                                    !values?.vrf?.vaccine_type ||
                                    !vrfData?.can_edit
                                }
                                required
                                withMarginTop
                                options={rounds}
                                isLoading={
                                    isFetchingCountries || isFetchingDropDowns
                                }
                                renderTags={renderRoundTag}
                            />
                        </Grid>
                    </Grid>
                    {isNormalType && (
                        <>
                            <Grid container item xs={12} spacing={2}>
                                <Grid item xs={6} md={3}>
                                    <Box mt={2}>
                                        <Field
                                            label={formatMessage(
                                                MESSAGES.date_vrf_signature,
                                            )}
                                            name="vrf.date_vrf_signature"
                                            component={DateInput}
                                            disabled={!vrfData?.can_edit}
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
                                            disabled={!vrfData?.can_edit}
                                        />
                                    </Box>
                                </Grid>

                                <Grid item xs={6} md={3}>
                                    <Box mt={2}>
                                        <Field
                                            label={formatMessage(
                                                MESSAGES.wastageRatio,
                                            )}
                                            name="vrf.wastage_rate_used_on_vrf"
                                            component={NumberInput}
                                            disabled={!vrfData?.can_edit}
                                            numberInputOptions={{
                                                suffix: '%',
                                                max: 100,
                                            }}
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
                                            disabled={!vrfData?.can_edit}
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
                                        disabled={!vrfData?.can_edit}
                                    />
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Field
                                        label={formatMessage(
                                            MESSAGES.quantities_approved_by_orpg_in_doses,
                                        )}
                                        name="vrf.quantities_approved_by_orpg_in_doses"
                                        component={NumberInput}
                                        disabled={!vrfData?.can_edit}
                                    />
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Field
                                        label={formatMessage(
                                            MESSAGES.date_rrt_orpg_approval,
                                        )}
                                        name="vrf.date_rrt_orpg_approval"
                                        component={DateInput}
                                        disabled={!vrfData?.can_edit}
                                    />
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Field
                                        label={formatMessage(
                                            MESSAGES.targetPopulation,
                                        )}
                                        name="vrf.target_population"
                                        component={NumberInput}
                                        disabled={!vrfData?.can_edit}
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
                                        disabled={!vrfData?.can_edit}
                                    />
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Field
                                        label={formatMessage(
                                            MESSAGES.quantities_approved_by_dg_in_doses,
                                        )}
                                        name="vrf.quantities_approved_by_dg_in_doses"
                                        component={NumberInput}
                                        disabled={!vrfData?.can_edit}
                                    />
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Field
                                        label={formatMessage(
                                            MESSAGES.date_dg_approval,
                                        )}
                                        name="vrf.date_dg_approval"
                                        component={DateInput}
                                        disabled={!vrfData?.can_edit}
                                    />
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Box>
                                        <DocumentUploadWithPreview
                                            errors={documentErrors}
                                            onFilesSelect={files => {
                                                if (files.length) {
                                                    setFieldTouched(
                                                        'vrf.document',
                                                        true,
                                                    );
                                                    setFieldValue(
                                                        'vrf.document',
                                                        files,
                                                    );
                                                }
                                            }}
                                            disabled={!vrfData?.can_edit}
                                            document={values?.vrf?.document}
                                        />
                                    </Box>
                                </Grid>
                            </Grid>
                            <Grid container item xs={12} spacing={2}>
                                <Grid item xs={12} lg={6}>
                                    <InputComponent
                                        type="textarea"
                                        keyValue="vrf.comment"
                                        value={values?.vrf?.comment ?? ''}
                                        // errors={errors.comment ? errors.comment : []}
                                        label={MESSAGES.comments}
                                        onChange={onCommentChange}
                                        disabled={!vrfData?.can_edit}
                                        withMarginTop={false}
                                    />
                                </Grid>
                            </Grid>
                        </>
                    )}
                </Grid>
            </Box>
        </Box>
    );
};
