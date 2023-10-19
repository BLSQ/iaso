/* eslint-disable camelcase */
import {
    Button,
    CircularProgress,
    Grid,
    IconButton,
    Tooltip,
    Box,
    Typography,
} from '@material-ui/core';
import { Field, useFormikContext } from 'formik';
import React from 'react';
import { useSafeIntl } from 'bluesquare-components';
import moment from 'moment';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import PropTypes from 'prop-types';

import { TextInput } from '../../../components/Inputs';
import { useCurrentUser } from '../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils.ts';
import { userHasPermission } from '../../../../../../../hat/assets/js/apps/Iaso/domains/users/utils';
import { useStyles } from '../../../styles/theme';
import {
    useGeneratePreparednessSheet,
    useGetPreparednessData,
    useFetchPreparedness,
} from './hooks/useGetPreparednessData';
import MESSAGES from '../../../constants/messages';
import { PreparednessSummary } from './PreparednessSummary';

export const PreparednessConfig = ({ roundNumber, campaignName }) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const { values, setFieldValue, dirty } = useFormikContext();
    const { rounds = [], id: campaignId } = values;
    const currentUser = useCurrentUser();
    const isUserAdmin = userHasPermission('iaso_polio_config', currentUser);
    const currentRound = rounds.find(r => r.number === roundNumber);
    const roundIndex = rounds.findIndex(r => r.number === roundNumber);
    const roundStartDate = currentRound?.started_at;
    const isLockedForEdition = roundStartDate
        ? moment().isAfter(moment(roundStartDate, 'YYYY-MM-DD', 'day'))
        : false;
    const {
        mutate: generateSpreadsheetMutation,
        isLoading: isGeneratingSpreadsheet,
        error: generationError,
    } = useGeneratePreparednessSheet(values.id, roundNumber);
    const {
        preparedness_spreadsheet_url,
        last_preparedness: preparednessForm,
    } = currentRound;
    const { data: lastPreparedness, isLoading } = useGetPreparednessData(
        campaignId,
        roundNumber,
    );

    const preparednessData = preparednessForm ?? lastPreparedness;

    const key = `rounds[${roundIndex}].preparedness_spreadsheet_url`;
    const lastKey = `rounds[${roundIndex}].last_preparedness`;

    const previewMutation = useFetchPreparedness();

    const refreshData = () => {
        previewMutation.mutate(
            { googleSheetURL: preparedness_spreadsheet_url, campaignName },
            {
                onSuccess: data => {
                    setFieldValue(lastKey, data);
                },
            },
        );
    };

    const generateSpreadsheet = () => {
        generateSpreadsheetMutation(roundNumber, {
            onSuccess: data => {
                setFieldValue(key, data.url);
            },
        });
    };

    const message = isLockedForEdition
        ? formatMessage(MESSAGES.preparednessRoundStarted)
        : formatMessage(MESSAGES.preparednessIntro);

    return (
        <Box mt={4}>
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
                                isLockedForEdition ||
                                !isUserAdmin
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
        </Box>
    );
};

PreparednessConfig.defaultProps = {
    campaignName: undefined,
};

PreparednessConfig.propTypes = {
    roundNumber: PropTypes.number.isRequired,
    campaignName: PropTypes.string,
};
