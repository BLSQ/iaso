/* eslint-disable camelcase */
import {
    Button,
    CircularProgress,
    Grid,
    IconButton,
    Tab,
    Tooltip,
    Typography,
} from '@material-ui/core';
import { Field, useFormikContext } from 'formik';
import React from 'react';
import { useSafeIntl } from 'bluesquare-components';
import moment from 'moment';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import PropTypes from 'prop-types';
import { TabContext, TabList, TabPanel } from '@material-ui/lab';

import { isEmpty } from 'lodash';
import { TextInput } from '../components/Inputs';
import { useStyles } from '../styles/theme';
import {
    useGeneratePreparednessSheet,
    useGetPreparednessData,
    useFetchPreparedness,
    useFetchSurgeData,
} from '../hooks/useGetPreparednessData';
import MESSAGES from '../constants/messages';

const formatIndicator = indicatorValue => {
    if (indicatorValue === null || indicatorValue === undefined)
        return indicatorValue;
    if (typeof indicatorValue === 'number') return indicatorValue.toFixed(0);
    if (typeof indicatorValue === 'string') return indicatorValue;
    if (indicatorValue.length) return indicatorValue.join(' -- ');
    return indicatorValue;
};
const PreparednessSummary = ({ preparedness }) => {
    const { formatMessage } = useSafeIntl();
    if (!preparedness || isEmpty(preparedness)) return null;
    if (preparedness.status === 'error')
        return <Typography>Error: {preparedness.details}</Typography>;

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
                    {formatMessage(MESSAGES.spreadsheetImportTitle)}{' '}
                    {preparedness.title}. {formatMessage(MESSAGES.refreshedAt)}:{' '}
                    {createdAt.format('LTS')} ({createdAt.fromNow()})
                </Typography>
            </Typography>
        </>
    );
};

const PreparednessConfig = ({ roundKey }) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const { values, setFieldValue, dirty } = useFormikContext();
    const roundStartDate = values && values[roundKey]?.started_at;
    const isLockedForEdition = roundStartDate
        ? moment().isAfter(moment(roundStartDate, 'YYYY-MM-DD', 'day'))
        : false;
    const {
        mutate: generateSpreadsheetMutation,
        isLoading: isGeneratingSpreadsheet,
        error: generationError,
    } = useGeneratePreparednessSheet(values.id);
    const {
        preparedness_spreadsheet_url,
        last_preparedness: preparednessForm,
    } = values[roundKey];
    const { id: campaignId } = values;
    const { data: lastPreparedness, isLoading } = useGetPreparednessData(
        campaignId,
        roundKey,
    );

    const preparednessData = preparednessForm ?? lastPreparedness;

    const key = `${roundKey}.preparedness_spreadsheet_url`;
    const lastKey = `${roundKey}.last_preparedness`;

    const previewMutation = useFetchPreparedness();

    const refreshData = () => {
        previewMutation.mutate(preparedness_spreadsheet_url, {
            onSuccess: data => {
                setFieldValue(lastKey, data);
            },
        });
    };

    const generateSpreadsheet = () => {
        generateSpreadsheetMutation(null, {
            onSuccess: data => {
                setFieldValue(key, data.url);
            },
        });
    };

    const message = isLockedForEdition
        ? formatMessage(MESSAGES.preparednessRoundStarted)
        : formatMessage(MESSAGES.preparednessIntro);

    return (
        <Grid container spacing={2}>
            <Grid item>{message}</Grid>
            <Grid container direction="row" item spacing={2}>
                <Grid xs={12} md={8} item>
                    <Field
                        placeholder={formatMessage(
                            MESSAGES.enterOrCreateGoogleSheet,
                        )}
                        label={formatMessage(
                            MESSAGES.preparednessGoogleSheetUrl,
                        )}
                        name={key}
                        component={TextInput}
                        disabled={
                            previewMutation.isLoading ||
                            isGeneratingSpreadsheet ||
                            isLockedForEdition
                        }
                        className={classes.input}
                    />
                </Grid>
                {preparedness_spreadsheet_url?.trim().length > 0 && (
                    <>
                        <Grid item md={1}>
                            <IconButton
                                target="_blank"
                                href={preparedness_spreadsheet_url}
                                color="primary"
                            >
                                <OpenInNewIcon />
                            </IconButton>
                        </Grid>
                        <Grid item md={3}>
                            <Button
                                variant="contained"
                                color="primary"
                                disabled={
                                    previewMutation.isLoading ||
                                    isLockedForEdition
                                }
                                onClick={refreshData}
                            >
                                {formatMessage(
                                    MESSAGES.refreshPreparednessData,
                                )}
                            </Button>
                        </Grid>
                    </>
                )}
                {!preparedness_spreadsheet_url?.trim().length && (
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
                                        !values.id ||
                                        isLockedForEdition
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
                    {isLoading ||
                    previewMutation.isLoading ||
                    isGeneratingSpreadsheet ? (
                        <CircularProgress />
                    ) : (
                        <>
                            {previewMutation.isError && (
                                <Typography color="error">
                                    {previewMutation.error.non_field_errors}
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
                                preparedness={preparednessData}
                            />
                        </>
                    )}
                </Grid>
            </Grid>
        </Grid>
    );
};

PreparednessConfig.propTypes = {
    roundKey: PropTypes.string.isRequired,
};

export const PreparednessForm = () => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const { values, setFieldValue, setErrors } = useFormikContext();
    const { last_surge: lastSurge } = values;

    const surgeMutation = useFetchSurgeData();
    const refreshSurgeData = () => {
        surgeMutation.mutate(
            {
                surge_spreadsheet_url: values.surge_spreadsheet_url,
                country_name_in_surge_spreadsheet:
                    values.country_name_in_surge_spreadsheet,
            },
            {
                onSuccess: counters => {
                    setFieldValue('last_surge', counters);
                },
                onError: error => {
                    if (error.details) {
                        setErrors(error.details);
                    }
                },
            },
        );
    };
    const [currentTab, setCurrentTab] = React.useState('round_one');

    const handleChangeTab = (event, newValue) => {
        setCurrentTab(newValue);
    };

    return (
        <>
            <TabContext value={currentTab}>
                <TabList onChange={handleChangeTab}>
                    <Tab
                        label={formatMessage(MESSAGES.roundOne)}
                        value="round_one"
                    />
                    <Tab
                        label={formatMessage(MESSAGES.roundTwo)}
                        value="round_two"
                    />
                </TabList>
                <TabPanel value="round_one">
                    <PreparednessConfig roundKey="round_one" />
                </TabPanel>
                <TabPanel value="round_two">
                    <PreparednessConfig roundKey="round_two" />
                </TabPanel>
            </TabContext>

            <Grid container spacing={2}>
                <Grid container direction="row" item spacing={2}>
                    <Grid xs={12} md={8} item>
                        <Field
                            label={formatMessage(MESSAGES.recruitmentSurgeUrl)}
                            name="surge_spreadsheet_url"
                            component={TextInput}
                            disabled={surgeMutation.isLoading}
                            className={classes.input}
                        />
                        <Field
                            label={formatMessage(MESSAGES.countryNameInSheet)}
                            name="country_name_in_surge_spreadsheet"
                            component={TextInput}
                            disabled={surgeMutation.isLoading}
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
                            disabled={surgeMutation.isLoading}
                            onClick={refreshSurgeData}
                        >
                            {formatMessage(MESSAGES.refreshRecruitmentData)}
                        </Button>
                    </Grid>

                    <Grid xd={12} item>
                        {surgeMutation.isLoading && <CircularProgress />}
                        {lastSurge && (
                            <>
                                <Typography>{lastSurge.title}</Typography>
                                <Typography>
                                    {`${formatMessage(
                                        MESSAGES.whoToRecruit,
                                    )}: ${lastSurge.who_recruitment}`}
                                </Typography>
                                <Typography>
                                    {`${formatMessage(
                                        MESSAGES.whoCompletedRecruitement,
                                    )}: ${lastSurge.who_recruitment}`}
                                </Typography>
                                <Typography>
                                    {`${formatMessage(
                                        MESSAGES.unicefToRecruit,
                                    )}: ${lastSurge.unicef_recruitment}`}
                                </Typography>
                                <Typography>
                                    {`${formatMessage(
                                        MESSAGES.unicefCompletedRecruitement,
                                    )}: ${
                                        lastSurge.unicef_completed_recruitment
                                    }`}
                                </Typography>
                                <Typography variant="caption">
                                    {formatMessage(MESSAGES.refreshedAt)} :
                                    {lastSurge.created_at
                                        ? moment(lastSurge.created_at).format(
                                              'LTS',
                                          )
                                        : ''}
                                </Typography>
                            </>
                        )}
                    </Grid>
                </Grid>
            </Grid>
        </>
    );
};
