import React, { useCallback, FunctionComponent } from 'react';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
    Button,
    CircularProgress,
    Grid,
    IconButton,
    Tooltip,
    Box,
    Typography,
} from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { Field, useFormikContext } from 'formik';
import moment from 'moment';

import { userHasPermission } from '../../../../../../../hat/assets/js/apps/Iaso/domains/users/utils';
import { useCurrentUser } from '../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import { TextInput } from '../../../components/Inputs';
import MESSAGES from '../../../constants/messages';
import { ObrName, PolioCampaignValues, Round } from '../../../constants/types';
import { useStyles } from '../../../styles/theme';
import {
    useGeneratePreparednessSheet,
    useGetPreparednessData,
    useFetchPreparedness,
} from './hooks/useGetPreparednessData';
import { useGetLatestSubActivityDate } from './hooks/useGetSubactivitiesDates';
import { PreparednessSummary } from './PreparednessSummary';

type Props = {
    round: Round;
    campaignName?: ObrName;
};

export const PreparednessConfig: FunctionComponent<Props> = ({
    round,
    campaignName,
}) => {
    const roundNumber = round.number;
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const { values, setFieldValue, dirty } =
        useFormikContext<PolioCampaignValues>();
    const { rounds = [], id: campaignId } = values;

    const currentUser = useCurrentUser();
    const isUserAdmin = userHasPermission('iaso_polio_config', currentUser);
    const currentRound = rounds.find(r => r.number === roundNumber);
    const roundIndex = rounds.findIndex(r => r.number === roundNumber);
    const { data: latestSubactivity } = useGetLatestSubActivityDate({
        round,
    });
    const roundStartDate = moment(
        currentRound?.started_at,
        'YYYY-MM-DD',
        'day',
    );

    const referenceDate = latestSubactivity ?? roundStartDate;
    const isLockedForEdition = referenceDate
        ? moment().isAfter(referenceDate)
        : false;

    const key = `rounds[${roundIndex}].preparedness_spreadsheet_url`;
    const lastKey = `rounds[${roundIndex}].last_preparedness`;

    const onGenerateSheetSuccess = useCallback(
        data => {
            setFieldValue(key, data.url);
        },
        [key, setFieldValue],
    );
    const {
        mutateAsync: generateSpreadsheetMutation,
        isLoading: isGeneratingSpreadsheet,
        error: generationError,
    } = useGeneratePreparednessSheet(values.id, onGenerateSheetSuccess);

    const { preparedness_spreadsheet_url } = currentRound ?? {
        preparedness_spreadsheet_url: undefined,
    };
    const { data: lastPreparedness, isLoading } = useGetPreparednessData(
        campaignId,
        roundNumber,
    );

    const preparednessData = lastPreparedness;

    const previewMutation = useFetchPreparedness();

    const refreshData = () => {
        previewMutation.mutate(
            { googleSheetUrl: preparedness_spreadsheet_url, campaignName },
            {
                onSuccess: data => {
                    setFieldValue(lastKey, data);
                },
            },
        );
    };

    const generateSpreadsheet = () => {
        generateSpreadsheetMutation(roundNumber);
    };

    const message = isLockedForEdition
        ? formatMessage(MESSAGES.preparednessRoundStarted)
        : formatMessage(MESSAGES.preparednessIntro);

    return (
        <Box
            sx={{
                mt: 4,
            }}
        >
            <Grid container spacing={2}>
                <Grid>{message}</Grid>
                <Grid container direction="row" spacing={2}>
                    <Grid
                        size={{
                            xs: 12,
                            md: 8,
                        }}
                    >
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
                    {(preparedness_spreadsheet_url?.trim().length ?? 0) > 0 && (
                        <>
                            <Grid
                                size={{
                                    md: 1,
                                }}
                            >
                                <IconButton
                                    target="_blank"
                                    href={preparedness_spreadsheet_url ?? ''}
                                    color="primary"
                                >
                                    <OpenInNewIcon />
                                </IconButton>
                            </Grid>
                            <Grid
                                size={{
                                    md: 3,
                                }}
                            >
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
                            direction="column"
                            container
                            size={{
                                xs: 12,
                                md: 4,
                            }}
                            sx={{
                                alignContent: 'space-between',
                            }}
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
                    <Grid style={{ paddingBottom: 20 }} size={12}>
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
