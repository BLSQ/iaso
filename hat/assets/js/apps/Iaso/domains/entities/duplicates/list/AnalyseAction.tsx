import React, { FunctionComponent, useCallback } from 'react';
import moment from 'moment';
import { Button, Box, Tooltip, Grid } from '@mui/material';
import Autorenew from '@mui/icons-material/Autorenew';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { useSafeIntl } from 'bluesquare-components';
import { useStartAnalyse } from '../hooks/api/analyzes';
import { AnalysisTooltipTitle } from './AnalysisTooltipTitle';
import MESSAGES from '../messages';
import { Analysis } from '../types';
import { AnalysisModal } from './AnalysisModal';

type Props = {
    latestAnalysis: Analysis | undefined;
    isFetchingLatestAnalysis: boolean;
};

export const AnalyseAction: FunctionComponent<Props> = ({
    latestAnalysis,
    isFetchingLatestAnalysis,
}) => {
    const { formatMessage } = useSafeIntl();
    // const { data: latestAnalysis, isFetching: isFetchingLatestAnalysis } =
    //     useGetLatestAnalysis();

    const { mutateAsync: startAnalyse, isLoading: isSaving } =
        useStartAnalyse();
    const handleClick = useCallback(() => {
        startAnalyse({
            algorithm: latestAnalysis?.algorithm,
            entity_type_id: latestAnalysis?.metadata.entity_type_id,
            fields: latestAnalysis?.metadata.fields,
            parameters: latestAnalysis?.metadata.parameters,
        });
    }, [latestAnalysis, startAnalyse]);
    return (
        <Box minHeight={36} display="flex" width="100%">
            {!latestAnalysis &&
                !isFetchingLatestAnalysis &&
                formatMessage(MESSAGES.noAnalysis)}

            <>
                {latestAnalysis && (
                    <Box mr="auto">
                        <Box display="flex" alignItems="center">
                            <Box display="inline-block" mr={1}>
                                {latestAnalysis.finished_at &&
                                    formatMessage(MESSAGES.latestAnalysis, {
                                        finishedAt: moment(
                                            latestAnalysis.finished_at,
                                        ).format('LTS'),
                                    })}
                                {!latestAnalysis.finished_at &&
                                    formatMessage(MESSAGES.analysisBusy)}
                            </Box>
                            <Tooltip
                                arrow
                                title={
                                    <AnalysisTooltipTitle
                                        analysis={latestAnalysis}
                                    />
                                }
                            >
                                <InfoOutlinedIcon
                                    style={{ cursor: 'pointer' }}
                                />
                            </Tooltip>
                        </Box>
                    </Box>
                )}
                <Grid container spacing={1} justifyContent="flex-end">
                    {latestAnalysis && (
                        <Grid item>
                            <Box mb={2} mt={2}>
                                <Button
                                    disabled={
                                        !latestAnalysis.finished_at || isSaving
                                    }
                                    variant="contained"
                                    color="primary"
                                    onClick={handleClick}
                                    size="small"
                                >
                                    <Box display="inline-block" mr={1} pt="6px">
                                        <Autorenew fontSize="small" />
                                    </Box>
                                    {formatMessage(MESSAGES.relaunchAnalysis)}
                                </Button>
                            </Box>
                        </Grid>
                    )}
                    <Grid item>
                        <Box mb={2} mt={2}>
                            <AnalysisModal iconProps={{}} />
                        </Box>
                    </Grid>
                </Grid>
            </>
        </Box>
    );
};
