import React, { FunctionComponent, useCallback, useEffect } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { Field, useFormikContext } from 'formik';
import { FilesUpload, useSafeIntl } from 'bluesquare-components';
import { SingleSelect } from '../../../../../components/Inputs/SingleSelect';
import { MultiSelect } from '../../../../../components/Inputs/MultiSelect';
import { DateInput } from '../../../../../components/Inputs/DateInput';
import { NumberInput } from '../../../../../components/Inputs';
import { TextArea } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/forms/TextArea';
import MESSAGES from '../../messages';
import {
    renderRoundTag,
    useCampaignDropDowns,
    useGetCountriesOptions,
} from '../../hooks/api/vrf';
import { useSharedStyles } from '../shared';
import { useSkipEffectUntilValue } from '../../hooks/utils';
import { acceptPDF, processErrorDocsBase } from '../utils';

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

    const { values, setFieldTouched, setFieldValue, errors } = useFormikContext<any>();
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


    const processDocumentErrors = useCallback(processErrorDocsBase, [errors]);


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
                            disabled={false}
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
                                label={formatMessage(MESSAGES.roundNumbers)}
                                name="vrf.rounds"
                                component={MultiSelect}
                                disabled={!values?.vrf?.vaccine_type}
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
                                            label={formatMessage(
                                                MESSAGES.wastageRatio,
                                            )}
                                            name="vrf.wastage_rate_used_on_vrf"
                                            component={NumberInput}
                                            disabled={false}
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
                                <Grid item xs={6} md={3}>
                                    <Field
                                        label={formatMessage(
                                            MESSAGES.targetPopulation,
                                        )}
                                        name="vrf.target_population"
                                        component={NumberInput}
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
                                        label={formatMessage(
                                            MESSAGES.date_dg_approval,
                                        )}
                                        name="vrf.date_dg_approval"
                                        component={DateInput}
                                        disabled={false}
                                    />
                                </Grid>
                                <Grid item xs={6} md={3}>
                                <Box>
                                        <FilesUpload
                                            accept={acceptPDF}
                                            files={values?.vrf?.document? [values?.vrf?.document]: []}
                                            onFilesSelect={files => {
                                                if (files.length) {
                                                    setFieldTouched('vrf.document', true);
                                                    setFieldValue('vrf.document', files);
                                                }
                                                console.log("File selected :" + files.length)
                                                console.dir(files)
                                            }}
                                            multi={false}
                                            errors={processDocumentErrors(errors.document)}

                                            placeholder={formatMessage(
                                                MESSAGES.document,
                                            )}
                                        />
                                    </Box>
                                </Grid>
                            </Grid>
                            <Grid
                                container
                                item
                                xs={12}
                                spacing={2}
                            >
                                <Grid item xs={12} lg={6}>
                                    {/* With MUI 5, the spacing isn't taken into account if there's only one <Grid> item
                                      so the <Box> is used to compensate and align the TextArea with the other fields
                                    */}
                                    <Box mr={1}>
                                        <TextArea
                                            value={values?.vrf?.comment ?? ''}
                                            // errors={errors.comment ? errors.comment : []}
                                            label={formatMessage(
                                                MESSAGES.comments,
                                            )}
                                            onChange={onCommentChange}
                                            debounceTime={0}
                                        />
                                    </Box>
                                    
                                </Grid>

                                {/* <Grid item xs={12} lg={6}>
                           
                                </Grid> */}
                            </Grid>
                        </>
                    )}
                </Grid>
            </Box>
        </Box>
    );
};
