/* eslint-disable camelcase */
import {
    Button,
    CircularProgress,
    Grid,
    IconButton,
    Tooltip,
    Typography,
} from '@material-ui/core';
import { Field, useFormikContext } from 'formik';
import React, { useMemo, useState } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import moment from 'moment';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { TextInput } from '../components/Inputs';
import { useStyles } from '../styles/theme';
import {
    useGeneratePreparednessSheet,
    useGetPreparednessData,
    useSurgeData,
} from '../hooks/useGetPreparednessData';
import MESSAGES from '../constants/messages';

const formatIndicator = indicatorValue => {
    if (typeof indicatorValue === 'number') return indicatorValue.toFixed(0);
    if (typeof indicatorValue === 'string') return indicatorValue;
    if (indicatorValue.length) return indicatorValue.join(' -- ');
    return indicatorValue;
};
const PreparednessSummary = ({ preparedness, preperadness_sync_status }) => {
    const { formatMessage } = useSafeIntl();
    if (!preparedness) return null;
    if (preparedness.error)
        return (
            <Typography>
                Error: {preparedness.error}: {preparedness.details}
            </Typography>
        );

    const createdAt = moment(preparedness.created_at);
    return (
        <>
            <Grid container direction="row">
                <Grid item md={4}>
                    <Typography>
                        {`${formatMessage(MESSAGES.national)}: ${
                            preparedness.national_score
                        }%`}
                    </Typography>
                </Grid>
                <Grid item md={4}>
                    <Typography>
                        {`${formatMessage(MESSAGES.regional)}: ${
                            preparedness.regional_score
                        }%`}
                    </Typography>
                </Grid>
                <Grid item md={4}>
                    <Typography>
                        {`${formatMessage(MESSAGES.districtScore)}: ${
                            preparedness.district_score
                        }%`}
                    </Typography>
                </Grid>
            </Grid>

            <Typography>
                <table>
                    <thead>
                        <tr>
                            <th>S/N</th>
                            <th>Indicator</th>
                            <th>National</th>
                            <th>Regions</th>
                            <th>Districts</th>
                        </tr>
                    </thead>
                    <tbody>
                        {preparedness.indicators &&
                            Object.values(preparedness.indicators).map(
                                indicator => (
                                    <tr key={indicator.key}>
                                        <td>{indicator.sn}</td>
                                        <td>{indicator.title}</td>
                                        <td>
                                            {formatIndicator(
                                                indicator.national,
                                            )}
                                        </td>
                                        <td>
                                            {formatIndicator(indicator.regions)}
                                        </td>
                                        <td>
                                            {formatIndicator(
                                                indicator.districts,
                                            )}
                                        </td>
                                    </tr>
                                ),
                            )}
                    </tbody>
                </table>
                <Typography variant="caption">
                    {formatMessage(MESSAGES.sync_status)}:{' '}
                    {preperadness_sync_status}.
                    {formatMessage(MESSAGES.refreshedAt)}:{' '}
                    {createdAt.format('LTS')} ({createdAt.fromNow()})
                </Typography>
            </Typography>
        </>
    );
};

export const PreparednessForm = () => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const [preparednessDataTotals, setPreparednessDataTotals] = useState();
    const [surgeDataTotals, setSurgeDataTotals] = useState();
    const { values, setFieldValue, dirty } = useFormikContext();
    const { last_preparedness: lastPreparedness, last_surge: lastSurge } =
        values;
    const totalSummary = useMemo(
        () => preparednessDataTotals || lastPreparedness,
        [preparednessDataTotals, lastPreparedness],
    );
    const surgeSummary = useMemo(
        () => surgeDataTotals || lastSurge,
        [surgeDataTotals, lastSurge],
    );
    const { mutate, isLoading, isError, error } = useGetPreparednessData();
    const {
        mutate: generateSpreadsheetMutation,
        isLoading: isGeneratingSpreadsheet,
        error: generationError,
    } = useGeneratePreparednessSheet(values.id);

    const { preperadness_spreadsheet_url = '' } = values;

    const refreshData = () => {
        mutate(preperadness_spreadsheet_url, {
            onSuccess: data => {
                const { totals, ...payload } = data;

                setPreparednessDataTotals(totals);
                const { national_score, regional_score, district_score } =
                    totals;
                setFieldValue('preparedness_data', {
                    spreadsheet_url: preperadness_spreadsheet_url,
                    national_score,
                    district_score,
                    regional_score,
                    payload,
                });
            },
        });
    };

    const isProcessingData = ['QUEUED', 'ONGOING'].includes(
        values.preperadness_sync_status,
    );

    const {
        mutate: surgeMutate,
        isLoading: surgeIsLoading,
        isError: surgeIsError,
        error: surgeError,
    } = useSurgeData();
    const refreshSurgeData = () => {
        surgeMutate(
            {
                google_sheet_url: values.surge_spreadsheet_url,
                surge_country_name: values.country_name_in_surge_spreadsheet,
            },
            {
                onSuccess: counters => {
                    setSurgeDataTotals(counters);
                    const {
                        unicef_completed_recruitment,
                        unicef_recruitment,
                        who_completed_recruitment,
                        who_recruitment,
                    } = counters;
                    setFieldValue('surge_data', {
                        spreadsheet_url: values.surge_spreadsheet_url,
                        unicef_completed_recruitment,
                        unicef_recruitment,
                        who_completed_recruitment,
                        who_recruitment,
                        payload: counters,
                    });
                    setFieldValue(
                        'country_name_in_surge_spreadsheet',
                        values.surge_country_name,
                    );
                },
            },
        );
    };

    const generateSpreadsheet = () => {
        generateSpreadsheetMutation(null, {
            onSuccess: data => {
                setFieldValue('preperadness_spreadsheet_url', data.url);
            },
        });
    };

    return (
        <>
            <Grid container spacing={2}>
                <Grid item>
                    Configure the Google Sheets that will be used to import the
                    preparedness data about campaign.
                </Grid>
                <Grid container direction="row" item spacing={2}>
                    <Grid xs={12} md={8} item>
                        <Field
                            placeholder={formatMessage(
                                MESSAGES.enterOrCreateGoogleSheet,
                            )}
                            label={formatMessage(
                                MESSAGES.preparednessGoogleSheetUrl,
                            )}
                            name="preperadness_spreadsheet_url"
                            component={TextInput}
                            disabled={isLoading || isGeneratingSpreadsheet}
                            className={classes.input}
                        />
                    </Grid>
                    {preperadness_spreadsheet_url?.trim().length > 0 && (
                        <>
                            <Grid item md={1}>
                                <IconButton
                                    target="_blank"
                                    href={preperadness_spreadsheet_url}
                                    color="primary"
                                >
                                    <OpenInNewIcon />
                                </IconButton>
                            </Grid>
                            <Grid item md={3}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    disabled={isLoading || isProcessingData}
                                    onClick={refreshData}
                                >
                                    {formatMessage(
                                        MESSAGES.refreshPreparednessData,
                                    )}
                                </Button>
                            </Grid>
                        </>
                    )}
                    {!preperadness_spreadsheet_url?.trim().length && (
                        <Grid
                            xs={12}
                            md={4}
                            item
                            direction="column"
                            container
                            alignContent="space-between"
                        >
                            <Tooltip
                                title={
                                    dirty || !values.id
                                        ? 'Please save modification before generating a sheet'
                                        : 'Generate a google sheet'
                                }
                            >
                                <span>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        color="primary"
                                        disabled={
                                            isGeneratingSpreadsheet ||
                                            dirty ||
                                            !values.id
                                        }
                                        onClick={generateSpreadsheet}
                                    >
                                        {formatMessage(
                                            MESSAGES.generateSpreadsheet,
                                        )}
                                    </Button>
                                </span>
                            </Tooltip>
                        </Grid>
                    )}
                    {/* the padding bottom is a horrible quick fix to remove */}
                    <Grid xd={12} item style={{ paddingBottom: 20 }}>
                        {isLoading || isGeneratingSpreadsheet ? (
                            <CircularProgress />
                        ) : (
                            <>
                                {isError && (
                                    <Typography color="error">
                                        {error.non_field_errors}
                                    </Typography>
                                )}
                                {generationError && (
                                    <Typography color="error">
                                        {`${formatMessage(
                                            MESSAGES.preparednessError,
                                        )}: ${generationError.message}`}
                                    </Typography>
                                )}
                                <PreparednessSummary
                                    preparedness={totalSummary}
                                    preperadness_sync_status={
                                        values.preperadness_sync_status
                                    }
                                />
                            </>
                        )}
                    </Grid>
                </Grid>
            </Grid>
            <Grid container spacing={2}>
                <Grid container direction="row" item spacing={2}>
                    <Grid xs={12} md={8} item>
                        <Field
                            label={formatMessage(MESSAGES.recruitmentSurgeUrl)}
                            name="surge_spreadsheet_url"
                            component={TextInput}
                            disabled={isLoading}
                            className={classes.input}
                        />
                        <Field
                            label={formatMessage(MESSAGES.countryNameInSheet)}
                            name="country_name_in_surge_spreadsheet"
                            component={TextInput}
                            disabled={isLoading}
                            className={classes.input}
                        />
                    </Grid>
                    <Grid xs={6} md={1} item>
                        <IconButton
                            target="_blank"
                            href={values.surge_spreadsheet_url}
                            color="primary"
                        >
                            <OpenInNewIcon />
                        </IconButton>
                    </Grid>
                    <Grid xs={6} md={3} item>
                        <Button
                            variant="contained"
                            color="primary"
                            disabled={surgeIsLoading}
                            onClick={refreshSurgeData}
                        >
                            {formatMessage(MESSAGES.refreshRecruitmentData)}
                        </Button>
                    </Grid>

                    <Grid xd={12} item>
                        {surgeIsLoading ? (
                            <CircularProgress />
                        ) : (
                            <>
                                {surgeIsError && (
                                    <Typography color="error">
                                        {surgeError.non_field_errors}
                                    </Typography>
                                )}
                                {surgeSummary && (
                                    <>
                                        <Typography>
                                            {surgeSummary.title}
                                        </Typography>
                                        <Typography>
                                            {`${formatMessage(
                                                MESSAGES.whoToRecruit,
                                            )}: ${
                                                surgeSummary.who_recruitment
                                            }`}
                                        </Typography>
                                        <Typography>
                                            {`${formatMessage(
                                                MESSAGES.whoCompletedRecruitement,
                                            )}: ${
                                                surgeSummary.who_recruitment
                                            }`}
                                        </Typography>
                                        <Typography>
                                            {`${formatMessage(
                                                MESSAGES.unicefToRecruit,
                                            )}: ${
                                                surgeSummary.unicef_recruitment
                                            }`}
                                        </Typography>
                                        <Typography>
                                            {`${formatMessage(
                                                MESSAGES.unicefCompletedRecruitement,
                                            )}: ${
                                                surgeSummary.unicef_completed_recruitment
                                            }`}
                                        </Typography>
                                        <Typography variant="caption">
                                            {formatMessage(
                                                MESSAGES.refreshedAt,
                                            )}{' '}
                                            :
                                            {surgeSummary.created_at
                                                ? moment(
                                                      surgeSummary.created_at,
                                                  ).format('LTS')
                                                : ''}
                                        </Typography>
                                    </>
                                )}
                            </>
                        )}
                    </Grid>
                </Grid>
            </Grid>
        </>
    );
};
