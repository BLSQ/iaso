/* eslint-disable camelcase */
import {
    Button,
    CircularProgress,
    Grid,
    IconButton,
    Tab,
    Typography,
    Box,
} from '@material-ui/core';
import { Field, useFormikContext } from 'formik';
import React, { useState } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import moment from 'moment';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { TabContext, TabList, TabPanel } from '@material-ui/lab';

import { TextInput } from '../components/Inputs';
import { useStyles } from '../styles/theme';
import { useFetchSurgeData } from '../hooks/useGetPreparednessData';
import MESSAGES from '../constants/messages';

import { PreparednessConfig } from './PreparednessConfig';

export const preparednessFormFields = [
    'surge_spreadsheet_url',
    'country_name_in_surge_spreadsheet',
];

export const PreparednessForm = () => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const { values, setFieldValue, setErrors } = useFormikContext();
    const { rounds = [] } = values;
    const sortedRounds = [...rounds].sort((a, b) => a.number - b.number);
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
    const defaultRoundNumber = Number.isInteger(sortedRounds[0]?.number)
        ? `${sortedRounds[0]?.number}`
        : '1';

    const [currentTab, setCurrentTab] = useState(defaultRoundNumber);

    const handleChangeTab = (event, newValue) => {
        setCurrentTab(newValue);
    };

    return (
        <Box mt={-4}>
            <TabContext value={currentTab}>
                <TabList onChange={handleChangeTab} className={classes.subTabs}>
                    {sortedRounds.map(round => (
                        <Tab
                            className={classes.subTab}
                            key={round.number}
                            label={`${formatMessage(MESSAGES.round)} ${
                                round.number
                            }`}
                            value={`${round.number}`}
                        />
                    ))}
                </TabList>
                {sortedRounds.map(round => (
                    <TabPanel
                        value={`${round.number}`}
                        key={round.number}
                        className={classes.tabPanel}
                    >
                        <PreparednessConfig roundNumber={round.number} />
                    </TabPanel>
                ))}
            </TabContext>

            <Grid container spacing={2}>
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
                                {`${formatMessage(MESSAGES.whoToRecruit)}: ${
                                    lastSurge.who_recruitment
                                }`}
                            </Typography>
                            <Typography>
                                {`${formatMessage(
                                    MESSAGES.whoCompletedRecruitement,
                                )}: ${lastSurge.who_recruitment}`}
                            </Typography>
                            <Typography>
                                {`${formatMessage(MESSAGES.unicefToRecruit)}: ${
                                    lastSurge.unicef_recruitment
                                }`}
                            </Typography>
                            <Typography>
                                {`${formatMessage(
                                    MESSAGES.unicefCompletedRecruitement,
                                )}: ${lastSurge.unicef_completed_recruitment}`}
                            </Typography>
                            <Typography variant="caption">
                                {formatMessage(MESSAGES.refreshedAt)} :
                                {lastSurge.created_at
                                    ? moment(lastSurge.created_at).format('LTS')
                                    : ''}
                            </Typography>
                        </>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
};
